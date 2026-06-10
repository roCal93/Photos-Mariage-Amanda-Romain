import { createHash, randomBytes } from 'node:crypto'

const plainToken = randomBytes(24).toString('base64url')
const tokenHash = createHash('sha256').update(plainToken).digest('hex')

console.log('Plain token:')
console.log(plainToken)
console.log('')
console.log('SHA-256 hash to store in Strapi Upload Token.tokenHash:')
console.log(tokenHash)
console.log('')
console.log('Public upload link example:')
console.log(`/fr/deposer/${plainToken}`)