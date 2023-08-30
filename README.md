# @sumdoo/require

`@sumdoo/require` 为大型组件或项目入口提供 `CDN` 异步加载

## 作为大型组件加载使用示例

```ts
import { $require, $config } from '@sumdoo/require'

$config({
    paths: {
        echarts: '@echarts/5.3.3/echarts.min',
    },
})

const COLORS = ['#89c3eb','#bce2e8','#7CE0C3','#ED8D3E','#ADDD71','#5DC9F1','#DF5578','#4580F7']

export function initEcharts(el: any, option: any) {
    $require(['echarts'], (echarts: any) => {
        option = { ...option, color: option.color ?? COLORS }

        const $echart = el.$echart = echarts.init(el)
        el.$echart = $echart

        $echart.clear()
        $echart.setOption(option)
    })
}
```

## 作为项目入口加载使用示例

```ts
import { $config, $define, $require } from '@sumdoo/require'

// IS_PROD 由 vite.config.html 注入
const is_prod  = (window as any)["IS_PROD"] !== false

// 根据是否生产模式加载不同的js
const prod_min = is_prod ? ".prod.min" : ""

$config({
    paths: {
        "vue"             : `@vue/3.2.38/vue.global${ prod_min }`,
        "vue-router"      : `@vue-router/4.1.5/vue-router.global${ prod_min }`,
        "vue-demi"        : "@vue-demi/0.13.11/index.iife.min",
        "pinia"           : `@pinia/2.0.21/pinia.iife${ prod_min }`,
        "element-plus"    : "@element-plus/2.2.16/index.full.min",
        "element-plus-css": "@element-plus/2.2.16/index.min.css",

        "@element-plus/icons-vue": [
            "https://cdn.jzzp.vip/npm/@element-plus/icons-vue@2.0.9/dist/index.iife.min.js",
            "https://unpkg.com/@element-plus/icons-vue@2.0.9/dist/index.iife.min.js",
            "https://cdn.jsdelivr.net/npm/@element-plus/icons-vue@2.0.9/dist/index.iife.min.js",
        ],

        "xe-utils": [
            "https://cdn.jzzp.vip/npm/xe-utils@3.5.6/dist/xe-utils.umd.min.js",
            "https://unpkg.com/xe-utils@3.5.6/dist/xe-utils.umd.min.js",
            "https://cdn.jsdelivr.net/npm/xe-utils@3.5.6/dist/xe-utils.umd.min.js",
        ],
        "vxe-table": [
            "https://cdn.jzzp.vip/npm/vxe-table@4.2.8/lib/index.amd.min.js",  // 手工改版以支持 require.js
        ],
        "vxe-table-css": [
            "https://cdn.jzzp.vip/npm/vxe-table@4.2.8/lib/style.css",
            "https://unpkg.com/vxe-table@4.2.8/lib/style.css",
            "https://cdn.jsdelivr.net/npm/vxe-table@4.2.8/lib/style.css",
        ],
    },
    shim: {
        "vue"                    : { exports: "Vue" },
        "vue-router"             : { exports: "VueRouter", deps: ["vue"] },
        "vue-demi"               : { exports: "VueDemi", deps: ["vue"] },
        "pinia"                  : { exports: "Pinia", deps: ["vue-demi"] },
        "element-plus"           : { deps: ["vue", "@element-plus/icons-vue", "css!element-plus-css"] },
        "@element-plus/icons-vue": { exports: "ElementPlusIconsVue", deps: ["vue"] },
        "vxe-table"              : { deps: ["vue", "xe-utils", "css!vxe-table-css"] },
    },
})

// vue-demi v0.13.11
// https://cdn.bootcdn.net/ajax/libs/vue-demi/0.13.11/index.iife.js
// 代码较少，直接定义了该模块
$define("vue-demi", ["vue"], (Vue: any) => {
    // 注入到全局变量
    const VueDemi = (window as any).VueDemi = {} as any

    for (const key in Vue) {
        VueDemi[key] = Vue[key]
    }

    VueDemi.isVue2 = false
    VueDemi.isVue3 = true
    VueDemi.install = function () {}
    VueDemi.Vue = Vue
    VueDemi.Vue2 = undefined
    VueDemi.version = Vue.version

    VueDemi.set = (target: any, key: any, val: any) => {
        if (Array.isArray(target)) {
            target.length = Math.max(target.length, key)
            target.splice(key, 1, val)
        } else {
            target[key] = val
        }
        return val
    }

    VueDemi.del = (target: any, key: any) => {
        if (Array.isArray(target)) {
            target.splice(key, 1)
        } else {
            delete target[key]
        }
    }

    return VueDemi
})

const globalMap: Record<string, string> = {
    "vue"                    : "Vue",
    "vue-router"             : "VueRouter",
    "vue-demi"               : "VueDemi",
    "pinia"                  : "Pinia",
    "element-plus"           : "ElementPlus",
    "@element-plus/icons-vue": "ElementPlusIconsVue",
//  "xe-utils"               : "XEUtils",
//  "vxe-table"              : "VXETable",
}

$require(Object.keys(globalMap), () => {
    const _window = window as any

    // 注入到全局变量
    for (const id in globalMap) {
        const name = globalMap[id]!
        _window[name] = _window[name] || _window.require(id)
    }

    // 启动应用
    import('./bootstrap')
})
```
