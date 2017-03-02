(function($)
{
	/*******************************************************
		APP
	********************************************************/
	var App = window.App =
	{
		options: {

		},

		run: function(options)
		{
			var app = this;

			app.options = $.extend(true, app.options, options);

			// thickbox
			var thickbox = new sk.widgets.Thickbox();
			thickbox.control('.thickbox');
			thickbox.width=650;

		}
	};
})(jQuery)
