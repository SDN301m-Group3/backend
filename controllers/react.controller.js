const React = require('../models/react.model');

module.exports = {
    getReactListOfPhoto: async (req, res, next) => {
        try {
            const { photoId } = req.params;
    
            const reacts = await React.find({ photo: photoId }, '_id user createdAt updatedAt')
                .populate('user', '_id username fullName email img');
            
            res.status(200).json(reacts);
        } catch (error) {
            next(error);
        }
    },
}