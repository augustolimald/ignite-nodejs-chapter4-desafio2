export default {
  jwt: {
    secret: process.env.JWT_SECRET as string || 'blabla',
    expiresIn: '1d'
  }
}
