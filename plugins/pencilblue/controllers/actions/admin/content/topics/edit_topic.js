/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Creates a new topic
     */
    function NewTopic(){}
    util.inherits(NewTopic, pb.BaseController);

    NewTopic.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUId, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
                    self.queryService = new pb.SiteQueryService(self.pathSiteUId, true);
                    var siteService = new pb.SiteService();
                    siteService.getSiteNameByUid(self.pathSiteUId, function (siteName) {
                        self.siteName = siteName;
                        cb();
                    });
                }
            });
        });
    };

    NewTopic.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
            return;
        }

        this.getJSONPostParams(function(err, post) {
            message = self.hasRequiredParams(post, ['name']);
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
                });
                return;
            }

            var dao = new pb.DAO();
            dao.loadById(vars.id, 'topic', function(err, topic) {
                if(util.isError(err) || !util.isObject(topic)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                    });
                    return;
                }

                pb.DocumentCreator.update(post, topic);

                self.queryService.loadByValue('name', topic.name, 'topic', function(err, testTopic) {
                    if(testTopic && !testTopic[pb.DAO.getIdField()].equals(topic[pb.DAO.getIdField()])) {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_TOPIC'))
                        });
                        return;
                    }

                    self.queryService.save(topic, function(err, result) {
                        if(util.isError(err)) {
                            return cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                            });
                        }

                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, topic.name + ' ' + self.ls.get('EDITED'))});
                    });
                });
            });
        });
    };

    //exports
    return NewTopic;
};
