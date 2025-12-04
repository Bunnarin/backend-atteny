// create empty user
onRecordValidate((e) => {
    const employees_changed = e.record.get('employees') != e.record.original().get('employees')
    if (!employees_changed) 
        return e.next();
    // now we get_or_create employees
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = e.record.get('employees').filter(email => emailRegex.test(email));
    let existingUsers = $app.findAllRecords("users", $dbx.exp(`email IN ("${emails.join('", "')}")`));
    emails.forEach(email => {
        if (existingUsers.find(user => user.get('email') == email)) 
            return;
        // create on their behalf
        const newUser = new Record($app.findCollectionByNameOrId("users"));
        newUser.set("email", email);
        $app.save(newUser); // we use the ORM cuz we want it to run onRecordCreate hook
    });
    e.next();
}, "workplace")