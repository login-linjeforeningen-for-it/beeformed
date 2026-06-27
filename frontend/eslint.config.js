import config from 'utilbee/eslint'
import tailwind from 'eslint-plugin-tailwindcss'

export default [
    ...config,
    {
        ...tailwind.configs['recommended'],
        settings: {
            tailwindcss: {
                cssConfigPath: 'src/app/globals.css',
            },
        },
    },
]
