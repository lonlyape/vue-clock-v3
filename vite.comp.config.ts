import path from 'path'

function comp() {
  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, './src/components/index.js'),
        name: 'vue-clock',
        fileName: 'vue-clock'
      },
      rollupOptions: {
        external:['vue'],
        output: {
          globals:{
            vue:'Vue'
          }
        }
      }
    }
  }
}

export default comp