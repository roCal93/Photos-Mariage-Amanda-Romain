import type { Core } from '@strapi/strapi'
import { randomUUID } from 'node:crypto'

async function ensurePublicPhotoPermissions(strapi: Core.Strapi) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const connection = strapi.db.connection
  const publicRole = await connection('up_roles')
    .select('id')
    .where({ type: 'public' })
    .first()

  if (!publicRole?.id) {
    return
  }

  const actions = ['api::photo.photo.find', 'api::photo.photo.findOne']
  const now = Date.now()

  for (const action of actions) {
    let permission = await connection('up_permissions')
      .select('id')
      .where({ action })
      .first()

    if (!permission?.id) {
      const inserted = await connection('up_permissions').insert({
        document_id: randomUUID().replace(/-/g, '').slice(0, 24),
        action,
        created_at: now,
        updated_at: now,
        published_at: now,
      })

      const permissionId = Array.isArray(inserted) ? inserted[0] : inserted
      permission = { id: Number(permissionId) }
    }

    const existingLink = await connection('up_permissions_role_lnk')
      .select('id')
      .where({ permission_id: permission.id, role_id: publicRole.id })
      .first()

    if (!existingLink?.id) {
      const lastOrder = await connection('up_permissions_role_lnk')
        .where({ role_id: publicRole.id })
        .max<{ max?: number }>('permission_ord as max')
        .first()

      await connection('up_permissions_role_lnk').insert({
        permission_id: permission.id,
        role_id: publicRole.id,
        permission_ord: (lastOrder?.max ?? 0) + 1,
      })
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Keep mobile uploads correctly oriented before responsive formats are generated.
    strapi.config.set('plugin::upload.settings.autoOrientation', true)
    await ensurePublicPhotoPermissions(strapi)
  },
}
