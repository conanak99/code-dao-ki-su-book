(function($)
{

	// SK THICKBOX
	// --------------------------------
	// verze: 3
	// vytvořil: Michal Matuška
	// editoval:
	// 15.7.2010 | Michal Matuška - oprava funkčnosti písmen z klávesnice - při napsání "c" nebo "x" do inputu se zavíral thickbox

	// Popis:
	// ---------------------------------
	// pomocí methody .control($('jquery object')) se přidá elementu(počítá se s odkazem) click událost, která otevírá thickbox, obsah boxu je automaticky detekován z hrefu odkazu.
	//
	// Dašlí methody na otevření boxu
	// 1) openHtml('string') otevře box pokud je třeba a zobrazí požadovaný html řetězec
	// 2) openUrl('string') otevře box pokud je třeba, načte ajaxem požadovanou url a zobrazí odpověď v boxu
	// 3) openHash('string || #string') otevře box pokud je třeba, zkontroluje zda hash existuje a zkopíruje ho do boxu
	//
	// U načítání url je možnost zobrazit z odpovědi ajaxu jen určitou část pomocí hashe a to např. takto '/kontakty#contactForm'.


	// Nastavení: (všechny vlastnosti jsou veřejné, pokud však není vyloženě potřeba zkrz nějakou fatal opravu používejte jen vypsané)
	// ---------------------------------
	// width (int) = jak má být box široký
	// autoWidth (bool) = pokud je nastaven na true u obrázků se bude měnit šířka boxu podle obrázku
	// onOpen (řetězec) = callback funkce, která se provede při otevření boxu
	// onLoad (funkce) = callback funkce, která se provede po načtení obsahu
	// onClose (funkce) = callback funkce, která se provede při zavření boxu

	// Vyžaduje:
	// ---------------------------------
	// 1) Jquery 1.4.2

	// TODO:
	// ---------------------------------
	// 1) nedetekuje swf - nyní se dá obejít přes openHtml, vše ale ručně  :)
	// 2) nedetekuje flv - nyní se dá obejít přes openHtml, vše ale ručně  :)
	// 3) nedetekuje iframe - nyní se dá obejít přes openHtml, vše ale ručně  :)



	sk.widgets.Thickbox = function (element, options){

		this.overlay = null;
		this.overlayI = null;
		this.window = {};
		this.$doc = $(document);
		this.$body = $('body');
		this.$html = $('html');
		this.langcode = this.$html.attr('lang') || 'cs';
		this.langs = {
			cs: { close: "Zavřít", prev: "předchozí", next: "následující" },
			en: { close: "Close", prev: "previous", next: "next" },
			de: { close: "Zumachen", prev: "vorige", next: "folgend" },
			es: { close: "Vaer", prev: "previo", next: "siguiente" },
			fr: { close: "Fermer", prev: "précédant", next: "suivant" },
			it: { close: "Chiudere", prev: "previo", next: " veniente" },
			ru: { close: "закрыть", prev: "предшествующий", next: "последующий" }
		};
		// wp langs
		this.langs['cs-CZ'] = this.langs.cs;
		this.langs['en-GB'] = this.langs['en-US'] = this.langs['en-CA'] = this.langs.en;
		this.langs['de-DE'] = this.langs.de;
		this.langs['ru-RU'] = this.langs.ru;
		this.langs['fr-FR'] = this.langs.fr;

		// html template
		this.html = "\
		<div id='sk-box-top'> \
			<div id='sk-box-bottom'> \
				<div id='sk-box-left'> \
					<div id='sk-box-right'> \
						<div id='sk-content'> \
							<h2 id='sk-box-title'></h2> \
							<div id='sk-box-desc'></div> \
							<a href='#' id='sk-box-image' title='" + this.langs[this.langcode]["close"] + "'></a> \
							<p id='sk-box-pager'> \
								<a href='#' id='sk-box-prev' rel=''>" + this.langs[this.langcode]["prev"] + "<span></span></a> \
								<span id='sk-box-pages'></span> \
								<a href='#' id='sk-box-next' rel=''>" + this.langs[this.langcode]["next"] + "<span></span></a> \
							</p> \
						</div> \
					</div> \
				</div> \
			</div> \
		</div> \
		<a href='#' id='sk-box-close' title='" + this.langs[this.langcode]["close"] + "'> " + this.langs[this.langcode]["close"] + "</a> \
		<div id='sk-box-top-left'>&nbsp;</div> \
		<div id='sk-box-top-right'>&nbsp;</div> \
		<div id='sk-box-bottom-left'>&nbsp;</div> \
		<div id='sk-box-bottom-right'>&nbsp;</div>";

		this.width = 600;
		this.autoWidth = false;
		this.onOpen = null;
		this.onLoad = null;
		this.onClose = null;
		this.isOpen = false;

	};

	sk.widgets.Thickbox.prototype = {

		constructor: sk.widgets.Thickbox,

		// Kontrola elementů
		control: function(selector){
			this.$doc
				.delegate(selector, 'click', $.proxy(function(e)
				{
					this.open($(e.currentTarget), $(selector));
					e.preventDefault();
				}, this));
		},

		// otevření thickboxu
		open: function($this, $all)
		{
			if(!this.isOpen)
			{
				this.isOpen = true;
				this.handleOnOpen();
				this.overlayShow();
				this.boxShow();
			}
			this.window.elem
				.addClass('loading')
				.focusin(function(){
					$(this).addClass('focus');
				}).focusout(function(){
					$(this).removeClass('focus');
				});
			this.window.pages.hide();
			this.window.next.hide();
			this.window.prev.hide();
			this.window.image.hide();
			this.window.title.hide();


			if(typeof $this != 'undefined')
			{
				this.group($this, $all);
			}
		},

		// Seskupení odkazu
		group: function($this, $all)
		{

			var rel = $this.attr('data-rel');
			var that = this;
			var group = $all.filter('[data-rel="' + rel + '"]');

			if(rel && group.length > 1)
			{
				var htmlPages = '';
				group.each(function(i)
				{
					htmlPages += " <a href='" + this.href + "'>" + (i + 1) + "</a> ";
				});
				this.window.pages.empty().append(htmlPages);

				numbers = $("a", this.window.pages);
				numbers.bind('click', {that: this, numbers: numbers, all: group}, this.handleNumbers).eq(group.index($this)).trigger('click');

				this.window.prev.bind('click', function(){
					var $item = $('.active', that.window.pages).prev().length ? $('.active', that.window.pages).prev() : $('a', that.window.pages).last();
					$item.trigger('click');
					return false;
				});
				this.window.next.bind('click', function(){
					var $item = $('.active', that.window.pages).next().length ? $('.active', that.window.pages).next() : $('a', that.window.pages).first();
					$item.trigger('click');
					return false;
				});
				this.$doc.bind('keyup', {that: this}, this.handleKeyPage);

				this.window.pages.show();
				this.window.next.show();
				this.window.prev.show();
			}
			else
			{
				this.preload($this.get(0).href, $this);
			}
		},

		// Otevření url
		openUrl: function(href)
		{
			this.open();
			this.preloadUrl(href);
		},

		// Otevření HTML stringu
		openHtml: function(html)
		{
			this.open();
			this.window.content.show().html(html);
			this.handleOnLoad(html);
		},

		// Otevření hashe
		openHash: function(href)
		{
			this.open();
			this.preloadHash(href);
		},

		// rozpoznávací funkce
		preload: function(href, $this)
		{
			var img = /\.jpg|\.png|\.gif$/i,
				hash = /#/,
				$href = $this.attr('href');

			if(href.search(img) !== -1)
			{
				var $img = $('img', $this),
					title = ( $this.data('thickbox') && $this.data('thickbox').title ) || '',
					longdesc = ( $this.data('thickbox') && $this.data('thickbox').longdesc ) || '',
					desc = ( $this.data('thickbox') && $this.data('thickbox').desc ) || '';

					//console.log($this);

					desc = desc + ((desc && longdesc) ? ', ' : '') + ((longdesc) ? '<a href="' + longdesc + '">' + longdesc + '</a>' : '');

				if(title){
					this.window.title.show().text(title);
				}
				else{
					this.window.title.hide();
				}
				if(desc){
					this.window.content.show().html('<p>'+desc+'</p>');
				}
				else{
					this.window.content.hide();
				}

				this.window.image.show();
				this.preloadImage(href);
			}
			else if($href.search(hash) == 0 || ($href.search(hash) != -1 && window.location.href.split('#')[0] == href.split('#')[0] ))
			{
				this.preloadHash(href);
			}
			else
			{
				this.preloadUrl(href);
			}
		},

		// Načtení obrázku
		preloadImage: function(href){
			imgPreloader = document.createElement('img');

			$(imgPreloader).bind('load', {that: this}, function(e){
				var that = e.data.that,
					imgW = this.width;

				that.window.image.empty().append(this);

				if(that.autoWidth)
				{
					that.width = imgW + 2*34;
					that.boxPosition();
				}
				that.handleOnLoad(this);
			});
			$(imgPreloader).attr('src', href);

		},

		// Načtení url
		preloadUrl: function(href){
			var that = this,
				s = '?',
				 re1=/\?/;

			if (href.search(re1)!=-1){
				s = '&';
			}

			$.get(href + s + "ajax=true", function(data){
				var hash = (href.search(/#/) != -1) ? href.split('#')[1] : '';
				if(hash != ''){
					var frag = $('<div>'+ data +'</div>');
					var html = $('#' + unescape(hash), frag).clone();
				}
				else{
					var html = data;
				}

				that.window.content.show().html(html);
				that.window.image.hide();
				$('#sk-box-bottom-left, #sk-box-bottom-right').css('position', 'absolute');
				that.handleOnLoad(html);
			});

		},

		// Načtení hashe
		preloadHash: function(href){
			if(href.search(/#/) != -1 )
			{
				var hash = href.split('#')[1];
			}
			else
			{
				var hash = href;
			}

			if ( $('#'+hash).size() > 0 ) {
				var hashContent = $('#'+hash).html();
			}
			else{
				hashContent = 'Hash nenalezen';
			}

			this.window.content.show().html(hashContent);
			this.window.image.hide();
			this.handleOnLoad(hashContent);
		},

		// zavření thickboxu
		close: function()
		{
			this.isOpen = false;
			this.handleOnClose();
			this.boxHide();
			this.overlayHide();
		},

		// zobrazení boxu
		boxShow: function()
		{
			this.window.elem = $('<div id="sk-box-window"></div>');
			this.window.elem
				.html(this.html)
				.appendTo(this.$body);

			this.window.close = $("#sk-box-close", this.window.elem);
			this.window.title = $("#sk-box-title", this.window.elem);
			this.window.content = $("#sk-box-desc", this.window.elem);
			this.window.pager = $("#sk-box-pager", this.window.elem);
			this.window.pages = $("#sk-box-pages", this.window.elem);
			this.window.prev = $("#sk-box-prev", this.window.elem);
			this.window.next = $("#sk-box-next", this.window.elem);
			this.window.image = $("#sk-box-image", this.window.elem);

			this.window.close.bind('click', {that: this}, this.handleClose);
			this.$doc.bind('keyup', {that: this}, this.handleKeyClose);
			this.window.image.bind('click', {that: this}, function(e){
				var that = e.data.that;
				that.window.next.trigger('click');
				//that.window.next.is(':visible') ? that.window.next.trigger('click') : that.window.close.trigger('click');
				return false;
			});

			this.boxPosition();
		},

		// skrytí boxu
		boxHide: function()
		{
			this.window.close.unbind();
			this.window.next.unbind();
			this.window.prev.unbind();
			this.window.pages.find('a').unbind();
			this.$doc
				.unbind('keyup', this.handleKeyClose)
				.unbind('keyup', this.handleKeyPage);
			this.window.elem.remove();
		},

		// Počítání pozice boxu
		boxPosition: function()
		{
			var scroll = this.$html.scrollTop() || this.$body.scrollTop();

			this.window.elem.css({marginLeft: '-' + this.width/2 + 'px', width: this.width + 'px', top: (scroll + 40)+"px"});
		},

		// zobrazení překrytí
		overlayShow: function()
		{
			var h = this.$doc.height();

			this.overlayI = $('<iframe id="sk-box-HideSelect"></iframe>').height(h).appendTo(this.$body);
			this.overlay = $('<div id="sk-box-overlay"></div>').height(h).appendTo(this.$body);

			this.overlay
				.bind('click', {that: this}, this.handleClose);

		},

		// skrytí překrytí
		overlayHide: function()
		{
			this.overlay.unbind().remove();
			this.overlayI.remove();
		},

		getKey: function(e)
		{
			var keycode;
			if (!e)
			{
				var e = window.event;
			}
			if (e.keyCode)
			{
				keycode = e.keyCode;
			}
			else if (e.which)
			{
				keycode = e.which;
			}

			var key = String.fromCharCode(keycode).toLowerCase();

			return [keycode, key];
		},

		// UDÁLOSTI
		// zavření
		handleClose: function(e)
		{
			e.data.that.close();
			return false;
		},

		// zavření z klávesnice
		handleKeyClose: function(e)
		{
			var that = e.data.that,
				key = that.getKey(e);

			if(key[0] == 27 )
			{
				that.window.close.trigger('click');
			}

			return false;
		},

		// Další a předchozí stránka z klávesnice
		handleKeyPage: function(e)
		{
			var that = e.data.that,
				key = that.getKey(e);

			if(key[0] == 37)
			{
				that.window.prev.filter(':visible').trigger('click');
			}
			else if( key[0] == 39)
			{
				that.window.next.filter(':visible').trigger('click');
			}

			return false;
		},

		// klik na čísla
		handleNumbers: function(e)
		{
			var numbers = e.data.numbers,
				that = e.data.that,
				$this = $(this),
				index = numbers.index(this);

			numbers.removeClass('active');
			$this.addClass('active');


			/*if(index == 0)
			{
				that.window.prev.hide();
			}
			else
			{
				that.window.prev.show();
			}
			if(index == numbers.size() - 1)
			{
				that.window.next.hide();
			}
			else
			{
				that.window.next.show();
			}*/

			that.preload(this.href, e.data.all.eq(index));

			return false;
		},

		// onopen funkce - pro zpětné volání
		handleOnOpen: function()
		{
			if(typeof this.onOpen == 'function')
			{
				this.onOpen.call(this, this.window.elem);
			}
		},

		// onload funkce - pro zpětné volání
		handleOnLoad: function(content)
		{
			this.overlay.height(this.$doc.height());

			if(typeof this.onLoad == 'function')
			{
				this.onLoad.call(this, this.window.elem, content);
			}
			this.window.elem.removeClass('loading');
		},

		// onclose funkce - pro zpětné volání
		handleOnClose: function()
		{
			if(typeof this.onClose == 'function')
			{
				this.onClose.call(this, this.window.elem);
			}
		}

	};

})(jQuery);

