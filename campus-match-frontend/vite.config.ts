import { fileURLToPath, URL } from 'node:url'

import Components from '@uni-helper/vite-plugin-uni-components'
import { UvResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import { defineConfig, type PluginOption } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'

const uniPlugin = ((Uni as unknown as { default?: () => PluginOption }).default ??
  (Uni as unknown as () => PluginOption))

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    Components({
      dts: true,
      resolvers: [UvResolver()],
    }),
    uniPlugin(),
  ],
})
