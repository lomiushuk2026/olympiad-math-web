import { _ as __nuxt_component_0 } from "./nuxt-link-7CqHyJ0E.js";
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderComponent } from "vue/server-renderer";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/ufo@1.6.3/node_modules/ufo/dist/index.mjs";
import "../server.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/ofetch@1.5.1/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/hookable@5.5.3/node_modules/hookable/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/unctx@2.5.0/node_modules/unctx/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/h3@1.15.10/node_modules/h3/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "wrong",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const records = ref([]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-100 pb-20" }, _attrs))}><header class="bg-white shadow"><div class="max-w-7xl mx-auto py-6 px-4"><h1 class="text-2xl font-bold text-gray-900">错题本</h1></div></header><main class="max-w-7xl mx-auto py-6 px-4">`);
      if (loading.value) {
        _push(`<div class="text-center py-10 text-gray-500">加载中...</div>`);
      } else if (records.value.length === 0) {
        _push(`<div class="text-center py-10 text-gray-500"> 暂无错题记录 </div>`);
      } else {
        _push(`<div class="space-y-4"><!--[-->`);
        ssrRenderList(records.value, (record) => {
          _push(`<div class="bg-white rounded-lg shadow p-4"><div class="text-sm text-gray-500 mb-2">${ssrInterpolate(record.question?.topic?.name)} - ${ssrInterpolate(record.question?.difficulty === 1 ? "简单" : record.question?.difficulty === 2 ? "中等" : "困难")}</div><div class="text-lg mb-2">${ssrInterpolate(record.question?.content)}</div><div class="text-sm text-red-600">正确答案: ${ssrInterpolate(record.question?.answer)}</div><div class="text-sm text-gray-600 mt-2">解析: ${ssrInterpolate(record.question?.explanation)}</div><div class="text-xs text-gray-400 mt-2"> 错误次数: ${ssrInterpolate(record.wrongCount)} | 正确次数: ${ssrInterpolate(record.correctCount)}</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</main><nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-gray-500"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`刷题`);
          } else {
            return [
              createTextVNode("刷题")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/daily",
        class: "text-gray-500"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`每日一练`);
          } else {
            return [
              createTextVNode("每日一练")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/wrong",
        class: "text-blue-600 font-medium"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`错题本`);
          } else {
            return [
              createTextVNode("错题本")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/wrong.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=wrong-Btr8MQaI.js.map
