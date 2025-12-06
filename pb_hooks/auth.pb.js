// default values
onRecordCreate((e) => {
    e.record.set('id', e.record.get('email'))
    e.record.set('emailVisibility', true)
    // need this if we create the user programmatically
    e.record.set('password', 'password')
    // A/B test: set random test_group
    e.record.set('test_group', Math.round(Math.random()))
    // to bypass the unqiue mac_address check
    e.record.set('mac_address', e.record.get('id'))

    e.next()
}, "users")

onRecordAuthRequest(e => {
    const [userName, _] = e.record.get('id').split('@');
    const macAddress = e.requestInfo().body.mac_address.replaceAll(".", "");
    e.record.set('mac_address', macAddress || userName); // cuz web dont have deviceID
    $app.save(e.record);
    e.next();
});

