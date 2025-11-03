routerAdd("POST", "/set-device-id", (e) => {
    const { identifier } = e.requestInfo().body;
    e.auth.set('device_id', identifier);
    $app.save(e.auth);
    return e.json(200);
}, $apis.requireAuth())

routerAdd("POST", "/clockin/{id}", (e) => {
    const { date, time } = e.requestInfo().body;
    $app.db().newQuery(`
        INSERT INTO attendance (workplace, user, date, start_time)
        VALUES ({:workplace}, '${e.auth.get('id')}', {:date}, {:time})
    `).bind({ workplace: e.request.pathValue("id"), date, time}).execute();
    return e.json(200);
}, $apis.requireAuth())

routerAdd("POST", "/clockout/{id}", (e) => {
    const { date, time } = e.requestInfo().body;
    // wip: update or create
    $app.db().newQuery(`
        UPDATE attendance SET end_time = {:time}
        WHERE workplace = {:workplace} AND user = '${e.auth.get('id')}' AND date = {:date} AND end_time IS NULL
    `).bind({ workplace: e.request.pathValue("id"), date, time }).execute();
    return e.json(200);
}, $apis.requireAuth())

// when a user subscribes to a workplace (not added by the employer)
routerAdd("POST", "/subscribe/{id}", (e) => {
    const workplace = $app.findRecordById('workplace', e.request.pathValue("id"));
    if (!workplace)
        return e.json(404);
    
    if (workplace.get('employees').includes(e.auth.get('id')))
        return e.json(200, { "message": "already subscribed" });

    // add the user to the workplace
    workplace.set('employees+', e.auth.get('id'));
    // the workplace onValidate will enforce the max_employee limit
    $app.save(workplace);
    return e.json(200);
}, $apis.requireAuth())

// endpoint to set the nickname of employees
routerAdd("POST", "/set-nickname", (e) => {
    const { employees } = e.requestInfo().body;
    // Im too fking lazy to update in batch
    employees.forEach(({email, nickname}) => 
        $app.db().newQuery(`
            UPDATE users SET nickname = {:nickname} WHERE email = {:email}
        `).bind({ nickname, email }).execute());
    
    return e.json(200)
}, $apis.requireAuth())
