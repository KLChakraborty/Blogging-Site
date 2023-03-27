const blogModel = require('../models/blogsModel')
const authorModel = require('../models/authorModel');


const mongoose = require('mongoose')
const objectId = mongoose.isValidObjectId

//-----------------Create Blog----------------------------------------------------------------------------------------------------------------
let createBlog = async (req, res) => {

    try {
        let { title, body, authorId, category, tags, subcategory } = req.body

        if (!Object.keys(req.body).length > 0) {
            return res.status(400).send({ status: false, msg: "Provide Details" })
        };
        if (!title) {
            return res.status(400).send({ status: false, msg: "Title is required" })
        };
        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).send({ status: false, msg: "Enter valid title" })
        }

        let blogTitle = await blogModel.findOne({ title: req.body.title })// unique Title of Blog 

        if (blogTitle) {
            return res.status(400).send({ status: false, msg: "Title already exist" })
        }
        if (!body) {
            return res.status(400).send({ status: false, msg: "Body is required" })
        };
        if (typeof body !== "string" || body.trim().length === 0) {
            return res.status(400).send({ status: false, msg: "Enter valid body" })
        }

        if (!authorId) {
            return res.status(400).send({ status: false, msg: "Author Id is required" })
        };
        if (!objectId(authorId)) {
            return res.status(400).send({ status: false, msg: "Invalid Author ID" })
        };
        let checkAuthorId = await authorModel.findById(authorId)

        if (!checkAuthorId) {
            return res.status(404).send({ status: false, msg: "No such authorId" })
        };
        if (!category) {
            return res.status(400).send({ status: false, msg: "Category is required" })
        }

        if (typeof category !== "string" || category.trim().length === 0) {
            return res.status(400).send({ status: false, msg: "Enter valid category" })
        }

        if (typeof tags !== "string" || tags.trim().length === 0) {
            return res.status(400).send({ status: false, msg: "Enter valid tags" })
        }

        if (!subcategory) {
            return res.status(400).send({ status: false, msg: "Subcategory is required" })
        }
        if (typeof subcategory !== "string" || subcategory.trim().length === 0) {
            return res.status(400).send({ status: false, msg: "Enter valid subcategory" })
        }

        let savedData = await blogModel.create(req.body)
        return res.status(201).send({ status: true, data: savedData })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


//-----------------Get list of Blog--------------------------------------------------------------------------------------------------
const getBlogs = async function (req, res) {
    try {
        let filterQuery = { isDeleted: false, isPublished: true };
        let queryParams = req.query;

        if (!Object.keys(queryParams).length > 0) {
            let savedData = await blogModel.find(filterQuery)
            if (!savedData.length > 0) return res.status(404).send({ status: false, msg: "No data found" })
            return res.status(200).send({ status: true, data: savedData })
        }

        if (queryParams.authorId) {
            if (!objectId(queryParams.authorId)) {
                return res.status(400).send({ status: false, msg: "Invalid Author ID" })
            }
        };

        const blogData = await blogModel.find({ $and: [{ isDeleted: false, isPublished: true }, queryParams] });

        if (!blogData.length > 0) {
            return res.status(404).send({ status: false, message: "No blogs found" });
        }
        return res.status(200).send({ status: true, data: blogData })
    }

    catch (error) {
        res.status(500).send({ status: false, Error: error.message });
    }
};

//----------------Update the Details of Blog-------------------------------------------------------------------------------------------
const updateBlogs = async function (req, res) {
    try {
        const blogId = req.blogId

        let data = req.body;

        if (!Object.keys(data).length > 0) {
            return res.status(400).send({ status: false, msg: "Provide Data for Updation" })
        }

        if (data.title) {

            if (typeof data.title !== "string" || data.title.trim().length === 0) {
                return res.status(400).send({ status: false, msg: "Enter valid title" })
            }
        }

        if (data.body) {
            if (typeof data.body !== "string" || data.body.trim().length === 0) {
                return res.status(400).send({ status: false, msg: "Enter valid body to update" })
            }
        }

        if (data.tags) {
            if (typeof data.tags !== "string" || data.tags.trim().length === 0) {
                return res.status(400).send({ status: false, msg: "Enter valid tags to update" })
            }
        }

        if (data.subcategory) {
            if (typeof data.subcategory !== "string" || data.subcategory.trim().length === 0) {
                return res.status(400).send({ status: false, msg: "Enter valid subcategory to update" })
            }
        }

        let updatedData = await blogModel.findOneAndUpdate({ _id: blogId }, {
            $set: { isPublished: true, title: data.title, body: data.body, publishedAt: new Date() },
            $push: { tags: data.tags, subcategory: data.subcategory }
        }, { new: true });
        return res.status(200).send({ status: true, data: updatedData })

    } catch (error) { res.status(500).send({ status: false, msg: error.message }) }
};

//----------------------Delete Blog with Blog Id in path params------------------------------
const deleteBlogs = async function (req, res) {
    try {
        const blogId = req.blogId
        await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() } });
        return res.status(200).send({ status: true, msg: "Blog deleted successfully" })

    } catch (error) { res.status(500).send({ status: false, msg: error.message }) }
};
//----Delete Blog with Specific filters------------------------------------------------------------------------------------
const deleteByQuery = async function (req, res) {
    try {
        const query = req.query
        const { category , tags, subcategory, authorId } = query


        // // // Every time when user want to delete data by query then give author id for authorisation purpose and blog should be not deleted.
        let findObj = { isDeleted: false  , isPublished : false }


        // // // In next line we are looking user is authentic user and he/she can delete blog in own blogs.
        let tokenAuthorId = req.decodedToken
        // // Adding one attribute in findObj that is authorId by token data.
        findObj.authorId = tokenAuthorId



        if (category) {
            findObj["category"] = category
        }
        if (tags) {
            findObj["tags"] = tags
        }
        if (subcategory) {
            findObj["subcategory"] = subcategory
        }
        if (authorId) {
            findObj["authorId"] = authorId
        }



        // // Any data coming on query or not ?
        if ( Object.keys(findObj).length <= 3) return res.status(400).send({ Status: false, message: "Please give some data that you want to delete that is not deleted" })

        let data = await blogModel.updateMany(
            findObj,
            { $set: { isDeleted: true, deletedAt: Date.now() } }
        )

        // How many data matched with condition -->
        if (data.matchedCount <= 0) return res.status(404).send({ status: false, message: "No Data Found" })

        res.status(200).send({ status: true, message: `${data.matchedCount} is deleted` })
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports.createBlog = createBlog;
module.exports.getBlogs = getBlogs;
module.exports.updateBlogs = updateBlogs
module.exports.deleteBlogs = deleteBlogs
module.exports.deleteByQuery = deleteByQuery