module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // User is logged in, proceed to the next middleware
    }
    req.flash("error", "Please log in to access this page.");
    res.redirect("/auth/login"); // Redirect to login if not authenticated
}
