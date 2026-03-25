import { App } from 'vue';
import { PluginOptions } from './types';
import { default as DynamicScroller } from './components/DynamicScroller.vue';
import { default as DynamicScrollerItem } from './components/DynamicScrollerItem.vue';
import { default as RecycleScroller } from './components/RecycleScroller.vue';
export { useDynamicScroller } from './composables/useDynamicScroller';
export type { UseDynamicScrollerOptions, UseDynamicScrollerReturn } from './composables/useDynamicScroller';
export { useDynamicScrollerItem } from './composables/useDynamicScrollerItem';
export type { UseDynamicScrollerItemOptions, UseDynamicScrollerItemReturn } from './composables/useDynamicScrollerItem';
export { useIdState } from './composables/useIdState';
export { useRecycleScroller } from './composables/useRecycleScroller';
export type { UseRecycleScrollerOptions, UseRecycleScrollerReturn } from './composables/useRecycleScroller';
export { DynamicScroller, DynamicScrollerItem, RecycleScroller, };
export type * from './types';
declare const plugin: {
    version: string;
    install(app: App, options?: PluginOptions): void;
};
export default plugin;
