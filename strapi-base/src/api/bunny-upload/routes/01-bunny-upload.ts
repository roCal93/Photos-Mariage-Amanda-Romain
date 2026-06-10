export default {
  routes: [
    {
      method: 'POST',
      path: '/bunny-upload',
      handler: 'api::bunny-upload.bunny-upload.upload',
      config: {
        auth: false,
      },
    },
  ],
}