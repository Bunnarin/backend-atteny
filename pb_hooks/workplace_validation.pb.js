// create empty user
onRecordValidate((e) => {
    const employees_changed = e.record.get('employees') != e.record.original().get('employees')
    if (!employees_changed) 
        return e.next();
    // now we get_or_create employees
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = e.record.get('employees').filter(email => emailRegex.test(email));
    const existingUsers = arrayOf(new DynamicModel({"email": ""}));
    $app.db().newQuery(`
        SELECT email FROM users WHERE email IN ("${emails.join('", "')}")
    `).all(existingUsers);
    const userCollection = $app.findCollectionByNameOrId("users");
    emails.forEach(email => {
        if (existingUsers.find(user => user.email === email)) 
            return;
        // create on their behalf
        const newUser = new Record(userCollection);
        newUser.set("email", email);
        $app.save(newUser); // we use the ORM cuz we want it to run onRecordCreate hook
    })
    e.next()
}, "workplace")