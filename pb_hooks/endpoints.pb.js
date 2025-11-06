routerAdd("POST", "/set-device-id", (e) => {
    const { identifier } = e.requestInfo().body;
    e.auth.set('device_id', identifier);
    $app.save(e.auth);
    return e.json(200);
}, $apis.requireAuth())

routerAdd("POST", "/clockin/{id}", (e) => {
    let record = new Record($app.findCollectionByNameOrId("attendance"));
    record.set("id", Date.now());
    record.set("workplace", e.request.pathValue("id"));
    record.set("user", e.auth.get('id'));
    record.set("start_minute", Date.now() / 60000);
    $app.save(record);
    return e.json(200);
}, $apis.requireAuth())

routerAdd("POST", "/clockout/{id}", (e) => {
    const end_minute = Date.now() / 60000;

    // first we determine wheter its same day or not
    const start_of_today = Math.floor(Date.now() / 60000) * 60000;
    let totalSameDayAttendances = $app.findAllRecords(
        "attendance", 
        $dbx.exp(`id >= ${start_of_today}`),
        $dbx.exp(`start_minute <= ${end_minute}`),
        $dbx.hashExp({
            workplace: e.request.pathValue("id"),
            user: e.auth.get('id'),
            end_minute: 0,
        })
    );
    if (totalSameDayAttendances.length > 0) {
        const record = totalSameDayAttendances[0];
        record.set('end_minute', end_minute);
        $app.save(record);
        return e.json(200);
    } 

    // now try to find yesterday insstead (night shift)
    const start_of_ytd = Math.floor(Date.now() / 86400000) * 86400000;
    let totalYesterdayAttendances = $app.findAllRecords(
        "attendance", 
        $dbx.exp(`id >= ${start_of_ytd}`),
        $dbx.hashExp({
            workplace: e.request.pathValue("id"),
            user: e.auth.get('id'),
            end_minute: 0,
        })
    );
    if (totalYesterdayAttendances.length > 0) {
        const record = totalYesterdayAttendances[0];
        record.set('end_minute', end_minute);
        $app.save(record);
    }

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
    $app.saveNoValidate(workplace);
    return e.json(200);
}, $apis.requireAuth())

// endpoint to set the nickname of employees
routerAdd("POST", "/set-nickname", (e) => {
    const { employees } = e.requestInfo().body;
    // Im too fking lazy to update in batch
    employees.forEach(({email, nickname}) => 
        $app.db().newQuery(`
            UPDATE users SET nickname = {:nickname} WHERE id = {:email}
        `).bind({ nickname, email }).execute()
    );
    
    return e.json(200)
}, $apis.requireAuth())
