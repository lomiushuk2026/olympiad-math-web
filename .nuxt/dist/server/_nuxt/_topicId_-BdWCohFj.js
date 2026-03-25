import { defineComponent, ref, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderAttr } from "vue/server-renderer";
import { h as useRoute, b as useRouter } from "../server.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/ofetch@1.5.1/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/hookable@5.5.3/node_modules/hookable/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/unctx@2.5.0/node_modules/unctx/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/h3@1.15.10/node_modules/h3/dist/index.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs";
import "/Users/lomiushuk/olympiad-math/web/node_modules/.pnpm/ufo@1.6.3/node_modules/ufo/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[topicId]",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    useRouter();
    const loading = ref(true);
    const questions = ref([]);
    const userAnswers = ref([]);
    const answers = ref([]);
    const results = ref([]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-100 pb-20" }, _attrs))}><header class="bg-white shadow"><div class="max-w-7xl mx-auto py-6 px-4 flex items-center"><button class="mr-4 text-gray-600">← 返回</button><h1 class="text-2xl font-bold text-gray-900">刷题练习</h1></div></header><main class="max-w-7xl mx-auto py-6 px-4">`);
      if (loading.value) {
        _push(`<div class="text-center py-10 text-gray-500">加载中...</div>`);
      } else {
        _push(`<div class="space-y-6"><!--[-->`);
        ssrRenderList(questions.value, (q, idx) => {
          _push(`<div class="bg-white rounded-lg shadow p-6"><div class="text-sm text-gray-500 mb-2"> 第 ${ssrInterpolate(idx + 1)} 题 | ${ssrInterpolate(q.topic?.name)} | ${ssrInterpolate(q.difficulty === 1 ? "简单" : q.difficulty === 2 ? "中等" : "困难")}</div><div class="text-lg mb-4">${ssrInterpolate(q.content)}</div>`);
          if (answers.value[idx] !== void 0) {
            _push(`<div><div class="${ssrRenderClass([results.value[idx] ? "text-green-600" : "text-red-600", "font-medium"])}">${ssrInterpolate(results.value[idx] ? "✓ 正确" : "✗ 错误")}</div><div class="mt-2 text-sm">你的答案: ${ssrInterpolate(userAnswers.value[idx])}</div><div class="mt-2 text-sm text-gray-600">正确答案: ${ssrInterpolate(q.answer)}</div><div class="mt-2 text-sm text-gray-600">解析: ${ssrInterpolate(q.explanation)}</div></div>`);
          } else {
            _push(`<div class="space-y-3"><input${ssrRenderAttr("value", userAnswers.value[idx])} type="text" placeholder="输入答案" class="w-full border rounded px-4 py-3 text-lg"><button class="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"> 提交答案 </button></div>`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/practice/[gradeId]/[topicId].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=_topicId_-BdWCohFj.js.map
