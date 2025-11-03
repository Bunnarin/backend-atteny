onRecordAuthWithOAuth2Request((e) => {
    //collect the refreshtoken if the frontend prompts for it
    if (e.oAuth2User.refreshToken) {
        e.record.set('refresh_token', e.oAuth2User.refreshToken);
        $app.saveNoValidate(e.record);
    }

    e.next();
})

// default values
onRecordCreate((e) => {
    e.record.set('id', e.record.get('email'))
    e.record.set('emailVisibility', true)
    // need this if we create the user programmatically
    e.record.set('password', 'password')
    // A/B test: set random test_group
    e.record.set('test_group', Math.round(Math.random()))
    // to bypass the unqiue device_id check
    e.record.set('device_id', e.record.get('email'))
    
    e.next()
}, "users")

