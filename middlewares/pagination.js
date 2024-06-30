module.exports = {
    pagination: async (req, res, next) => {
        try {
            const {
                sort = 'desc',
                page = 1,
                pageSize = 30,
                search = '',
            } = req.query;

            const parsedPage = parseInt(page);
            const parsedPageSize = parseInt(pageSize);
            if (isNaN(parsedPage)) {
                throw createError(400, 'Invalid page value');
            }
            if (isNaN(parsedPageSize)) {
                throw createError(400, 'Invalid pageSize value');
            }
            if (parsedPageSize > 30) {
                throw createError(400, 'pageSize must be at most 30');
            }
            if (parsedPageSize < 1) {
                throw createError(400, 'pageSize must be at least 1');
            }

            return {
                sort,
                page: parsedPage,
                pageSize: parsedPageSize,
                search,
            };
        } catch (error) {
            next(error);
        }
    },
};
