/* global Package*/
Package.describe({
    name: 'socialize:user-blocking',
    version: '2.0.0',
    summary: 'Allow users to block each other',
    git: 'https://github.com/copleykj/socialize-user-blocking.git',
});

Package.onUse(function _(api) {
    api.versionsFrom(['2.8.1', '3.0-rc.0']);
    api.use([
        'check',
        'reywood:publish-composite@1.8.9',
        'socialize:user-model@2.0.0',
    ]);
    api.imply('socialize:user-model');
    api.mainModule('server/server.js', 'server');
    api.mainModule('common/common.js', 'client');
});
