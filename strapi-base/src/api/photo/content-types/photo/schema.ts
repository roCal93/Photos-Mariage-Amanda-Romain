export default {
  kind: 'collectionType',
  collectionName: 'photos',
  info: {
    singularName: 'photo',
    pluralName: 'photos',
    displayName: 'Photo',
    description: 'Media partage par un contributeur via le formulaire public',
  },
  options: {
    draftAndPublish: true,
  },
  pluginOptions: {
    i18n: {
      localized: false,
    },
  },
  attributes: {
    title: {
      type: 'string',
      required: true,
    },
    slug: {
      type: 'uid',
      targetField: 'title',
      required: true,
      pluginOptions: {
        i18n: {
          localized: false,
        },
      },
    },
    image: {
      type: 'media',
      multiple: false,
      required: false,
      allowedTypes: ['images', 'videos'],
    },
    mediaType: {
      type: 'enumeration',
      enum: ['image', 'video'],
      default: 'image',
      required: true,
    },
    externalUrl: {
      type: 'string',
    },
    externalMime: {
      type: 'string',
    },
    externalWidth: {
      type: 'integer',
    },
    externalHeight: {
      type: 'integer',
    },
    caption: {
      type: 'text',
    },
    authorName: {
      type: 'string',
      required: true,
    },
    visibility: {
      type: 'enumeration',
      enum: ['public', 'hidden'],
      default: 'public',
      required: true,
    },
    moderationStatus: {
      type: 'enumeration',
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    takenAt: {
      type: 'datetime',
    },
    tags: {
      type: 'json',
    },
    submitterEmail: {
      type: 'email',
      private: true,
    },
    uploadToken: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::upload-token.upload-token',
      inversedBy: 'photos',
    },
  },
}