export default async event => {
  // you can use ES7 with async/await and even TypeScript in your functions :)

  // await new Promise(r => setTimeout(r, 50))
  // process.env['TEST_VARIABLE'] = 'TestoTesto'

  // return {
  //   data: {
  //     message: `Hello ${event.data.name || 'World'}`
  //   }
  // }
  console.log(process.env['TEST_VARIABLE'])
  return {
    data: {
      message: `Hello ${process.env['TEST_VARIABLE'] || 'World'}`
    }
  }
}
