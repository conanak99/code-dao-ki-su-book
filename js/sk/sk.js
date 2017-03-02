(function($)
{
	var sk = window.sk = {
		base: {},
		utils: {},
		widgets: {},
		events: {}
	};

	sk.extend = function(child, parent) {
		var F = function(){};
		F.prototype = parent.prototype;
		child.prototype = new F();
		child._super =  parent.prototype;
		child.prototype.constructor = child;
	};

})(jQuery);
