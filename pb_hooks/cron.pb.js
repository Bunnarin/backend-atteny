// cleanup unverified user so that we don't have any non-belonging user (in case user mispelled email)
// we don't need to check if they belong in any workplace (since it's stored in a json array anw)
// if we did delete any user that is in a workplace, the next time the employer save the workplace, it will be recreated anw
cronAdd("cleanup_unverified_users", "@daily", () => 
    $app.db().newQuery(`DELETE FROM users WHERE verified = false`).execute()
)

// if the start date's month is last last month
cronAdd("cleanup_attendence", "@monthly", () => {
    const start_of_last_month = new Date();
    start_of_last_month.setMonth(start_of_last_month.getMonth() - 1, 1);
    $app.db().newQuery(`
        DELETE FROM attendance WHERE id < ${start_of_last_month.getTime()};
        DELETE FROM leave WHERE id < ${start_of_last_month.getTime()};
    `).execute();
})

// 7 day old
cronAdd("cleanup_old_transaction", "@weekly", () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    $app.db().newQuery(`DELETE FROM pending_transaction WHERE id < ${date.getTime()}`).execute();
})

// every day, we add the debt
cronAdd("create_debt_rm_employee", "@daily", () => {
    const config = require(`${__hooks}/config.js`);
    const users = arrayOf(new DynamicModel({"email": "", "debt": 0}));
    // when last_paid is less than last month (meaning that they haven't paid for last month yet)
    const thisMonth = new Date().getMonth() + 1; // translate to 1-based
    $app.db().newQuery(`
        UPDATE users u
        JOIN total_employees te ON u.id = te.id
        SET u.debt = (te.value - u.max_employees) * ${config.RENT_PRICE()}
        WHERE u.debt = 0 AND (${thisMonth} + 12 - u.last_paid) % 12 > 0
        RETURN u.email, u.debt
    `).all(users);
    users.forEach(({email, debt}) =>
        $app.newMailClient().send(new MailerMessage({
            to: [{address: email}],
            subject: "Monthly Payment Due",
            html: `You owe us ${debt} USD.`,
        }))
    );

    // rm employees if they hadnt pay even with us reminding them for a month alr
    const lateUsers = arrayOf(new DynamicModel({"email": "", "debt": 0}));
    $app.db().newQuery(`
        SELECT u.email, u.debt
        FROM users u
        WHERE u.debt > 0 AND (${thisMonth} + 12 - u.last_paid) % 12 > 1
    `).all(lateUsers);

    lateUsers.forEach(({email, debt}) => {
        // remove the quantity number of random employees from random workplaces
        const workplaces = $app.findRecordsByFilter("workplace", `employer='${email}'`);
        let numLeft = debt / config.RENT_PRICE();
        while (numLeft > 0) {
            // get the workplace with the highest number of employees (yes, its dynamic)
            const [ workplace ] = workplaces.sort((a, b) => b.get("employees").length - a.get("employees").length);
            const employees = workplace.get("employees");
            const numToRemove = Math.min(employees.length, numLeft);
            workplace.set('employees', employees.slice(numToRemove));
            $app.saveNoValidate(workplace);
            numLeft -= numToRemove;
        }

        // notify them
        $app.newMailClient().send(new MailerMessage({
            to: [{address: email}],
            subject: "Payment Failed",
            html: `You owe us ${debt} USD. 
            So, we have decided to randomly remove ${numLeft} employees from a random workplace.
            Please set new payment methods to add more employees`,
        }))
    })
})

// to pretend that we comply with payway's api quota or sth
// cronAdd("temp_payway", "* * * * *", () => {
//     const config = require(`${__hooks}/config.js`)
//     const transactions = $app.findRecordsByFilter("pending_transaction", "locked = false");
//     transactions.forEach(transaction => {
//         transaction.set('locked', true);
//         $app.saveNoValidate(transaction);
//         // read createdOn to ensure we only chekc 1mn after creation, if not 1mn yet, sleep until 1mn
//         const timeDiff = Date.now() - Number(transaction.get('id'));
//         if (timeDiff < 60 * 1000) 
//             sleep(60 * 1000 - timeDiff);
        
//         // then check if the transaction is approved in payway database
//         const payload = {
//             merchant_id: config.PAYWAY_MERCHANT_ID(),
//             tran_id: transaction.get('id'),
//         }
//         const startTime = Date.now();
//         let json;
//         do {
//             payload.req_time = Math.floor(Date.now() / 1000);
//             const hashStr = payload.req_time + payload.merchant_id + payload.tran_id
//             const hashedStr = $security.hs512(hashStr, config.PAYWAY_KEY())
//             payload.hash = Buffer.from(hashedStr, 'hex').toString('base64')
//             const res = $http.send({
//                 method: "POST",
//                 url: config.PAYWAY_ENDPOINT() + "/api/payment-gateway/v1/payments/check-transaction-2",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify(payload),
//             })
//             if (res.json.data.payment_status == 'APPROVED') {
//                 json = res.json;
//                 break;
//             }
//             sleep(30000);
//         } while (Date.now() - startTime < 15 * 60 * 1000)

//         if (!json)
//             return;
//         // fullfillment
//         const user = $app.findRecordById("users", transaction.get('user'));
//         const quantity = json.data.total_amount / config.BUY_PRICE();
//         user.set('max_employees', user.get('max_employees') + quantity)
//         $app.saveNoValidate(user);
//         // delete the transaction
//         $app.delete(transaction);
//     })
// })