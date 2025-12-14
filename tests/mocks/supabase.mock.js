const chain = {
    select: () => chain,
    insert: async () => ({ data: {}, error: null }),
    update: async () => ({ data: {}, error: null }),
    delete: async () => ({ data: {}, error: null }),
    eq: () => chain,
    order: () => chain,
    single: async () => ({ data: null, error: null })
};

export default {
    from: () => chain
};
