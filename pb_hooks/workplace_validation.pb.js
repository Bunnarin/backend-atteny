// create new user
onRecordValidate(e => {
    const userCollection = $app.findCollectionByNameOrId("users");
    // eliminate bad guess
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const certainExistingUsers = e.record.get('employees').filter(id => !id.includes('.'));
    const potentialNewUsers = e.record.get('employees').filter(email => emailRegex.test(email));
    let existingUsers = [];
    if (potentialNewUsers.length) // don't want to query uselessly
        existingUsers = $app.findAllRecords("users", $dbx.exp(`email IN ("${potentialNewUsers.join('", "')}")`));
    // TODO: batch create with sql, fk orm
    const transformedIds = potentialNewUsers.map(email => {
        const existingUser = existingUsers.find(user => user.get('email') == email);
        if (existingUser)
            return existingUser.get('id');
        // else create them via the orm
        let userRecord = new Record(userCollection);
        userRecord.set("email", email);
        $app.save(userRecord); // using the ORM instead of batch create sql cuz we want to use the hooks
        return userRecord.get('id'); // the newly generated id
    })
    e.record.set('employees', [...certainExistingUsers, ...transformedIds]);
    e.next();
}, "workplace")