// default values
onRecordCreate((e) => {
    e.record.set('id', e.record.get('email').replaceAll(".", "_"));
    e.record.set('emailVisibility', true);
    // need this if we create the user programmatically
    e.record.set('password', 'password');
    // A/B test: set random test_group
    e.record.set('test_group', Math.round(Math.random()));
    // to bypass the unqiue mac_address check
    e.record.set('mac_address', e.record.get('email'));

    e.next();
}, "users")

onRecordAuthRequest(e => {
    const macAddress = e.requestInfo().body.mac_address;
    e.record.set('mac_address', macAddress || e.record.get('id')); // cuz web dont have deviceID
    $app.save(e.record);
    e.next();
});

