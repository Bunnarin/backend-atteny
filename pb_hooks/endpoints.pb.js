// when a user subscribes to a workplace (not added by the employer)
routerAdd("POST", "/subscribe/{id}", (e) => {
    const workplace = $app.findRecordById('workplace', e.request.pathValue("id"));
    workplace.set('employees+', e.auth.get('id'));
    $app.saveNoValidate(workplace);
    return e.json(200);
}, $apis.requireAuth())

// endpoint to set the nickname of employees
// wip: batch update
routerAdd("POST", "/set-nickname", (e) => {
    const { employees } = e.requestInfo().body;
    // Im too fking lazy to update in batch
    employees.forEach(({email, nickname}) => 
        $app.db().newQuery(`
            UPDATE users SET nickname = {:nickname} WHERE email = {:email}
        `).bind({ nickname, email }).execute()
    );
    
    return e.json(200)
}, $apis.requireAuth())
