type __VLS_Props = {
    item: unknown;
    watchData?: boolean;
    active: boolean;
    index?: number;
    sizeDependencies?: Record<string, unknown> | unknown[] | null;
    emitResize?: boolean;
    tag?: string;
};
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: Readonly<Record<string, any>> & Record<string, any>;
    refs: {
        el: unknown;
    };
    rootEl: any;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resize: (id: string | number) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    onResize?: ((id: string | number) => any) | undefined;
}>, {
    index: number;
    watchData: boolean;
    sizeDependencies: Record<string, unknown> | unknown[] | null;
    emitResize: boolean;
    tag: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    el: unknown;
}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
