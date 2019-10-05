(function() {
	var app = angular.module("Portfolio", ['ui.router', 'ngAnimate', 'ui.bootstrap']);

	app.controller("ProjectController", ["$http", "$scope", function($http, $scope) {
		$scope.projectList = [];
		$scope.tagToProjectMap = [];

		console.log("ProjectController $id=" + $scope.$id);

		$http.get("./projects.json").then(
			function success(response) {
				if (response && response.data && response.data.Projects)
				{
					$scope.projectList = response.data.Projects;

					populateTags($scope.projectList, $scope.tags);
				}
			},
			function error(response) {
				console.log("Error: " + response.statusText);
			}
		);

		var populateTags = function(projects, tags)
		{
			if (!projects)
			{
				return;
			}

			tags = [];

			for(var i=0; i<projects.length; i++)
			{
				var proj = projects[i];

				for(var j=0; j<proj.tags.length; j++)
				{
					if (!tags[proj.tags[j]])
					{
						tags[proj.tags[j]] = [];
					}

					tags[proj.tags[j]].push(proj.title);
				}
			}

			// for (var key in tags)
			// {
			// 	console.log(key + ":");
			// 	for (var i=0; i<tags[key].length; i++)
			// 	{
			// 		console.log("\t" + tags[key][i]);
			// 	}
			// }
		}

		$scope.setProjectByName = function(projectName)
		{
			var currentTitle = '';
			if ($scope.currentProject != null && $scope.currentProject.title != null)
			{
				currentTitle = $scope.currentProject.title;
			}

			console.log("setProjectByName('" + currentTitle + "' => '" + projectName + "')");

			for (var i=0; i<$scope.projectList.length; i++)
			{
				if ($scope.projectList[i].title == projectName)
				{
					$scope.currentProject = $scope.projectList[i];
				}
			}
		}
	}]);

	app.directive("projectDescriptionContainer", function($compile)
	{
		return {
			restrict: "E",
			scope: {
				descriptionData: "="
			},
			link: function(scope, element, attrs, ctrl) {
				scope.descriptionHtml = [];
				
				scope.$watch('descriptionData', function(newValue, oldValue)
				{
					if (scope.descriptionData != null && scope.descriptionData.length != null)
					{
						// Clear the DOM
						for(var i=0; i<scope.descriptionHtml.length; i++)
						{
							scope.descriptionHtml[i].html.innerHTML = "";
						}
						scope.descriptionHtml = [];

						// Generate the new DOM
						for(var i=0; i<scope.descriptionData.length; i++)
						{
							scope.descriptionHtml.push({
								html: addParagraph(scope.descriptionData[i]),
								id: i
							});
						}
					}
				}, true);
				
				var addParagraph = function(paragraphStr)
				{
					var pElem = "<p>" + paragraphStr + "</p>";
					var newScope = scope.$new();
					var newElement = $compile(pElem)(newScope);
					return element.append(newElement)[0];
				}
			}
		}
	});

	app.directive("projectMediaContainer", function($compile)
	{
		return {
			restrict: "E",
			scope: {
				mediaList: "="
			},
			link: function(scope, element, attrs, ctrl) {
				scope.mediaHtml = [];

				scope.$watch('mediaList', function(newValue, oldValue)
				{
					if (scope.mediaList != null && scope.mediaList.length != null)
					{
						// Clear the DOM
						for(var i=0; i<scope.mediaHtml.length; i++)
						{
							scope.mediaHtml[i].html.innerHTML = "";
						}
						scope.mediaHtml = [];

						// Generate the new DOM
						for(var i=0; i<scope.mediaList.length; i++)
						{
							var html = "";
							switch (scope.mediaList[i].type)
							{
								case "image":
									html = addImage(scope.mediaList[i]);
									break;
	
								case "video":
									html = addVideo(scope.mediaList[i]);
									break;
	
								case "youtube":
									html = addYoutubeVideo(scope.mediaList[i]);
									break;
							}

							scope.mediaHtml.push({
								html: html,
								id: i
							});
						}
					}
				}, true);				

				var addImage = function(mediaData)
				{
					var pElem = "<image-item title='" + mediaData.title + "' url='" + mediaData.url + "'</image-item>\n";
					var newScope = scope.$new();
					var newElement = $compile(pElem)(newScope);
					return element.append(newElement)[0];
				}

				var addVideo = function(mediaData)
				{
					// Start video tag
					var videoTag = "<video width='100%' controls ";

					// Add poster if it exists
					if (mediaData.poster != null && mediaData.poster.length > 0)
					{
						videoTag += "poster='" + mediaData.poster + "'";
					}
					videoTag += ">";

					// Add video source
					videoTag += "<source src='" + mediaData.src + "' type=\"video/mp4\"></video>";

					// Generate new media element
					var pElem = "<div><h4>" + mediaData.title + "</h4>\n"
								+ "<div class='video-container'>\n"
								+ videoTag + "\n"
								+ "</div></div>";
					var newScope = scope.$new();
					var newElement = $compile(pElem)(newScope);
					return element.append(newElement)[0];
				}

				var addYoutubeVideo = function(mediaData)
				{
					var pElem = "<div><h4>" + mediaData.title + "</h4>\n"
								+ "<div class='video-container-youtube'>\n"
								+ "<iframe width='100%' src='https://www.youtube.com/embed/" + mediaData.code + "?enablejsapi=1'></iframe>\n"
								+ "</div></div>";
					var newScope = scope.$new();
					var newElement = $compile(pElem)(newScope);
					return element.append(newElement)[0];
				}
			}
		}
	});

	app.directive("projectModal", function($rootScope, $compile)
	{
		// 			// Clicking outside of the modal closes it
		// 			$(document).on('click', '.Modal-backdrop, .Modal-holder', function() {
		// 				$state.go('base');
		// 			});
		// 			$(document).on('click', '.Modal-box, .Modal-box *', function(e) {
		// 				e.stopPropagation();
		// 			});

		return {
			scope: {
				selectedProject: '='
			},
			transclude: true,
			templateUrl: "partials/modalTemplate.html",
			link: function(scope, element, attrs)
			{
				scope.isHidden = true;

				scope.closeModal = function()
				{
					scope.isHidden = true;
					scope.selectedProject = null;

					var videoElements;
					
					// Stop all videos if they're playing
					videoElements = element.find("video");
					for(var i=0; i<videoElements.length; i++)
					{
						videoElements[i].pause();
					}
					
					// Stop all videos if they're playing
					videoElements = element.find("iframe");
					for(var i=0; i<videoElements.length; i++)
					{
						//videoElements[i].stopVideo();
						videoElements[i].contentWindow.postMessage('{ "event":"command","func":"pauseVideo","args":"" }', '*');
					}
				}

				scope.$watch('selectedProject', function(newValue, oldValue)
				{
					if (newValue != undefined)
					{
						scope.setProjectData(newValue);
						scope.isHidden = false;
					}
				}, true);

				scope.setProjectData = function(projectData) 
				{
					if (!projectData)
						return;
					
					scope.projectName = projectData.title;
				};
			}
		};
	})

	app.directive("projectItem", function() {
		return {
			restrict: "E",
			transclude: true,
			templateUrl: "partials/projectItem.html",
			scope: {
				bgimage: '@',
				projname: '@',
				setProjectByName: '&'
			},
			link: function(scope, element, attrs, ctrl, transclude) {
				scope.onClicked = function()
				{
					console.log("projectItem " + scope.$id + " clicked!");

					var projname = scope.projname;
					scope.setProjectByName({projname: projname});
				}
			}
		};
	});

	app.directive("videoItem", function($sce) {
		return {
			restrict: "E",
			transclude: true,
			templateUrl: "partials/video.html",
			scope: {
				title: '@',
				src: '@'
			},
			link: function(scope, element, attrs, ctrl, transclude) {
				scope.$watch('src', function(newVal)
				{
					if (newVal)
					{
						scope.src = newVal;
					}
				});
			}
		};
	});

	app.directive("youtubeVideoItem", function($sce) {
		return {
			restrict: "E",
			transclude: true,
			templateUrl: "partials/youtubeVideo.html",
			scope: {
				title: '@',
				code: '@'
			},
			link: function(scope, element, attrs, ctrl, transclude) {
				scope.$watch('code', function(newVal)
				{
					if (newVal)
					{
						scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal);
					}
				});
			}
		};
	});

	app.directive("imageItem", function() {
		return {
			restrict: "E",
			transclude: true,
			templateUrl: "partials/image.html",
			scope: {
				title: '@',
				url: '@'
			},
			link: function(scope) {
				
			}
		};
	});

})();
