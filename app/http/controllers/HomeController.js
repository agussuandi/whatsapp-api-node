const HomeController = {
    async index(req, res, next) {
        return res.render('views/home/index')
    }
}

module.exports = HomeController