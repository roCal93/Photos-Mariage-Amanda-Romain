export default () => {
  return async (ctx: any, next: () => Promise<any>) => {
    await next()

    const headerName = 'Content-Security-Policy'
    let csp = ctx.response.get(headerName)

    const bunnyCdn = process.env.BUNNY_CDN_URL || 'https://cdn.bunnycdn.com'
    const bunnyStorage = 'https://storage.bunnycdn.com'

    // Build allowed origins list from ALLOWED_ORIGINS or CLIENT_URL fallback.
    const allowedEnv = process.env.ALLOWED_ORIGINS || undefined
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
    const clientUrlsSet = new Set<string>()

    if (allowedEnv) {
      allowedEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((u) => clientUrlsSet.add(u))
    } else {
      clientUrlsSet.add(clientUrl)
      let isLocalUrl = true
      try {
        const { hostname } = new URL(clientUrl)
        isLocalUrl = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
      } catch {
        isLocalUrl = true
      }
      if (!isLocalUrl) {
        const host = clientUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
        const base = host.replace(/^www\./, '')
        clientUrlsSet.add(`https://${base}`)
        clientUrlsSet.add(`https://www.${base}`)
        clientUrlsSet.add(`https://*.${base}`)
      }
    }

    const origins = Array.from(clientUrlsSet)

    if (!csp) {
      ctx.set(
        headerName,
        `default-src 'self'; img-src 'self' data: ${bunnyCdn} ${bunnyStorage} https://market-assets.strapi.io; media-src 'self' data: blob: ${bunnyCdn} ${bunnyStorage}; object-src 'self' ${bunnyCdn} ${bunnyStorage}; frame-src 'self' ${origins.join(' ')}; frame-ancestors 'self' ${origins.join(' ')}; script-src 'self'; style-src 'self' 'unsafe-inline'`
      )
      return
    }

    const hasBunny = (directive: string) =>
      /(^|\s)https:\/\/(cdn\.bunnycdn\.com|storage\.bunnycdn\.com)(\s|$)/.test(
        directive
      ) || directive.includes(bunnyCdn)

    let newCsp = csp
    if (newCsp.includes('img-src')) {
      newCsp = newCsp.replace(/img-src([^;]*)/, (match: string, group: string) => {
        if (hasBunny(match)) return match
        return `img-src${group} ${bunnyCdn} ${bunnyStorage}`
      })
    } else {
      newCsp = `${newCsp}; img-src 'self' data: ${bunnyCdn} ${bunnyStorage} https://market-assets.strapi.io`
    }

    if (newCsp.includes('media-src')) {
      newCsp = newCsp.replace(/media-src([^;]*)/, (match: string, group: string) => {
        if (hasBunny(match)) return match
        return `media-src${group} ${bunnyCdn} ${bunnyStorage}`
      })
    } else {
      newCsp = `${newCsp}; media-src 'self' data: blob: ${bunnyCdn} ${bunnyStorage}`
    }

    if (newCsp.includes('object-src')) {
      newCsp = newCsp.replace(/object-src([^;]*)/, (match: string, group: string) => {
        if (hasBunny(match)) return match
        if (match.includes("'none'")) {
          return `object-src 'self' ${bunnyCdn} ${bunnyStorage}`
        }
        return `object-src${group} ${bunnyCdn} ${bunnyStorage}`
      })
    } else {
      newCsp = `${newCsp}; object-src 'self' ${bunnyCdn} ${bunnyStorage}`
    }

    ctx.set(headerName, newCsp)
  }
}