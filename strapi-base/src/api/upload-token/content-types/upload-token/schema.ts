export default {
  kind: 'collectionType',
  collectionName: 'upload_tokens',
  info: {
    singularName: 'upload-token',
    pluralName: 'upload-tokens',
    displayName: 'Upload Token',
    description: 'Lien d\'upload public signe pour deposer des photos',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    i18n: {
      localized: false,
    },
  },
  attributes: {
    label: {
      type: 'string',
      required: true,
    },
    tokenHash: {
      type: 'string',
      required: true,
      unique: true,
    },
    isActive: {
      type: 'boolean',
      default: true,
      required: true,
    },
    expiresAt: {
      type: 'datetime',
    },
    maxUploads: {
      type: 'integer',
      default: 25,
      min: 1,
    },
    uploadCount: {
      type: 'integer',
      default: 0,
      min: 0,
    },
    requireModeration: {
      type: 'boolean',
      default: true,
      required: true,
    },
    photos: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::photo.photo',
      mappedBy: 'uploadToken',
    },
  },
}