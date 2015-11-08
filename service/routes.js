var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/worship');
var ObjectId = require('mongoose').Types.ObjectId; 

var songSchema = new Schema({
    title: String,
    raw: String,
    basekey: String,
    lyrics: String,
    lines_count: Number,
    metadata: {}
});
var textSearch = require('mongoose-text-search');
songSchema.plugin(textSearch);
songSchema.index({lyrics: 'text'});
var Song = mongoose.model('Song', songSchema)

var accountSchema = new Schema({
    email: String,
    password: { type: String, select: false },
    organisation: String,
    account_type: Number //0:superadmin, 1:can edit and add own, 2:can only view, can create and save orders
});
var Account = mongoose.model('Account', accountSchema)

var mammoth = require("mammoth"); //docx to html
var pdf = require('html-pdf'); //to make pdf files
var path = require('path'); //like not used

var fs = require('fs'); //file system, to delete generated pdf
var cheerio = require('cheerio'); //to crawl sites
var request = require('request'); //to request another page by urls, used by crawler

var md5 = require('MD5');

module.exports = function(app) {
    
    app.post('/get_all_songs', function(req,res){
        Song.find({},'',function(err,docs){
            if (err)
                console.log('error occured in the database');
            res.send(docs);
        });
    });
    
    app.post('/search_songs_by_title', function(req,res){
        if(req.body.title){
            Song.find({'title' : new RegExp(req.body.title, 'i')},'',function(err,docs){
                if (err)
                    console.log('error occured in the database');
                res.send(docs);
            });
        }
    });
    
    app.post('/search_songs_by_terms', function(req,res){
        if(req.body.terms){
            
            //db.songs.runCommand("text", {search:"\"long\" \"heart\""})  
            /*
            Song.find({'lyrics' : new RegExp(req.body.terms, 'i')},'',function(err,docs){
                if (err)
                    console.log('error occured in the database');
                res.send(docs);
            });
            */
            var options = { limit: 10 };
            Song.textSearch(req.body.terms, options, function (err, docs) {
                if (err)
                    console.log('error occured in the database');
                res.send(docs);
            });
            
            
        }
    });

    app.post('/get_song_by_id', function(req,res){
        
        if(req.body.id){
            try{
                var query = { '_id': new ObjectId(req.body.id) };
                Song.find(query,'',function(err,docs){
                    if (err)
                        console.log('error occured in the database');
                    
                    if(docs.length === 1){
                        data = docs[0];
                        data.getkey = data.basekey;
                        
                        res.send(data);
                        
                    }else{
                        res.send({fail:1, msg:"no songs found.", req:req.body});
                    }
                });
            }catch(err) {
                res.send({fail:1, msg:"error:"+err, req:req.body});
            }
        }
    });
    
    /*
    app.post('/change_song_key', function(req,res){
        raw_to_html(req.body.song, function(response) {
            res.send(response);
        });
    });
    */
    
    app.post('/login', function(req,res){
        var query = {'email' : req.body.user_login, 'password' : md5(req.body.user_pass)};
        Account.find(query,'',function(err,docs){
            if (err)
                console.log('error occured in the database');
            if(docs.length==1){
                res.send(docs[0]);
            }
            else
                res.send(false);
        });
    });
    
    app.post('/add_song', function(req,res){
        /*
        var data = {};
        data.title = "10,000 REASONS (BLESS THE LORD)";
        data.basekey = "D";
        data.subtitle = "intro: D G D A/C# Bm A G D\n(Matt Redman, Jonas Myrin)   ((Psalm 103:1-5))";
        data.raw = "_C:[D]Bless the [G]Lord, O my [D]soul, [A/C#]O my [Bm]soul\n[G]Worship His [D]holy [Asus4 - A]name\nSing like [G]never be[Bm]fore, [G]O [A]my [Bm]soul\n[G]I'll worship Your [A]holy [G/D - D]name\n\n_V:The [G]sun comes [D]up, it's a [A]new day [Bm]dawning\n[G]It's time to [D]sing Your [A]song a-[Bm]gain\nWhat-[G]ever may [D]pass\nAnd what-[A]ever lies be-[Bm]fore me\n[G2]Let me be [D]singing \nWhen the [Asus4 - A]even - ing [D]comes.\n\n_V:You're [G]rich in [D]love, and You're [A]slow to [Bm]anger\nYour [G]name is [D]great, and [A]Your heart is [Bm]kind\nFor [G]all Your [D]goodness, I will [A]keep on [Bm]singing\n[G2]Ten thousand [D]reasons \nFor my [Asus4]heart [A]to [D]find\n\n_V:And [G]on that [D]day when my [A]strength is [Bm]failing\nThe [G]end draws [D]near, and my [A]time has [Bm]come\n[G]Still my [D]soul will sing Your [A]praise un-[Bm]ending\n[G2]Ten thousand [D]years \nAnd then for - [Asus4 - A]e -- ver - [D]more!";
        */
        song = req.body.song;
        
        song.lyrics = "";
        song.lines_count = 0;
        
        var parts = song.raw.split("_");
        parts.shift();
        
        parts.forEach(function(part){
            
            var this_para = "";
            
            part = part.slice(2,part.length);
            
            var lines = part.split("\n");
            song.lines_count+= lines.length;
            lines.forEach(function(line){
                
                if(line!=''){
                    var arrStr = line.split(/[\[\]]+/);
                    var this_line = "";
                    
                    for(var i=0;i<arrStr.length;i++){
                        var temp_lyrics = arrStr[i].trim();
                        
                        if(i%2===0 && temp_lyrics!=""){
                            this_line+= temp_lyrics + " ";
                        }
                    }
                    if(this_line!=""){
                        this_para+= this_line+'<br/>';
                    }
                    
                }
            });
            
            if(this_para!=""){
                song.lyrics+= '<p>'+this_para+'</p>';
            }
        });
        
        Song.collection.insert(song, onInsert);
        function onInsert(err, status) {
            if (err) {
                console.log("some errors on insert ",song.title);
            }
            res.send(song);
        }
    
    });
    
    app.post('/add_user', function(req,res){
        /*
        var account = {};
        account.email= 'lonedune@gmail.com';
        account.password= md5('793586');
        account.organisation= "Acts Baptist Church";
        account.account_type= 0;
        
        Account.collection.insert(account, onInsert);
        function onInsert(err, status) {
            if (err) {
                console.log("some errors on insert ",song.title);
            }
            
            var account = {};
            account.email= 'joshuashoo@gmail.com';
            account.password= md5('joshyshoo!');
            account.organisation= "Acts Baptist Church";
            account.account_type= 1;
            
            Account.collection.insert(account, onInsert);
            function onInsert(err, status) {
                if (err) {
                    console.log("some errors on insert ",song.title);
                }
                res.send(account);
            }
            
        }
        */
    });
    
    
    
    app.post('/update_song', function(req,res){
        var song = req.body.song;

        song._id = ObjectId(song._id);
        
        song.lyrics = "";
        song.lines_count = 0;
        
        var parts = song.raw.split("_");
        parts.shift();
        
        parts.forEach(function(part){
            
            var this_para = "";
            
            part = part.slice(2,part.length);
            
            var lines = part.split("\n");
            song.lines_count+= lines.length;
            lines.forEach(function(line){
                
                if(line!=''){
                    var arrStr = line.split(/[\[\]]+/);
                    var this_line = "";
                    
                    for(var i=0;i<arrStr.length;i++){
                        var temp_lyrics = arrStr[i].trim();
                        
                        if(i%2===0 && temp_lyrics!=""){
                            this_line+= temp_lyrics + " ";
                        }
                    }
                    if(this_line!=""){
                        this_para+= this_line+'<br/>';
                    }
                    
                }
            });
            
            if(this_para!=""){
                song.lyrics+= '<p>'+this_para+'</p>';
            }
        });
        
        var query = { '_id': new ObjectId(song._id) };
        Song.collection.update(query, song, onUpdate);
        function onUpdate(err, docs) {
            if (err) console.log("some errors on update ",err);
            res.send(song);
        }
        
    });
    
    app.post('/create_pdf', function(req,res){
        
        var options = {
          "directory": "/tmp",       // The directory the file gets written into if not using .toFile(filename, callback). default: '/tmp' 

          // Papersize Options: http://phantomjs.org/api/webpage/property/paper-size.html 
          "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid 
          "orientation": "portrait", // portrait or landscape 
         
          // Page options
          "border": {
            "top": "1cm",            // default is 0, units: mm, cm, in, px 
            "right": "2cm",
            "bottom": "2cm",
            "left": "1cm"
          },
         
          "header": {
            "height": "0mm",
            "contents": '<div style="text-align: center;"></div>'
          },
          "footer": {
            "height": "5mm",
            "contents": '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>'
          },
          "type": "pdf",             // allowed file types: png, jpeg, pdf 
        }
        
        var html = '<html><style>td{font-size:12px;}h1{font-size:14px;}.chorus, .verses, .bridge{padding-bottom: 20px; display:block;}.chorus{color:#800;}.lyric {line-height:15px;margin-top:2em;}.chord { position: absolute}.chord .inner {position: relative;top: -1em;text-shadow:#CCC -1px 1px;font-style: italic;}.song_subtitle{line-height:0px;}</style>';
        
        var left_right_counter = 0;
        for(var i=0;i<req.body.songs.length;i++){
            if(left_right_counter%2==0){
                html+= '<div style="page-break-before:always; width:100%"><table border=0 width="100%"><tr>';
            }

            html+= '<td width="50%" valign="top">';
            html+= '<h1>'+ req.body.songs[i].title +'</h1>';
            html+= req.body.songs[i].body;
            html+= '</td>';

            if(left_right_counter%2==1){
                html+= '</tr></table></div>';
            }
            left_right_counter++;
        }
        html+= '</html>';
        
        pdf.create(html, options).toFile(function(err, buffer) {
            if (err) return console.log("err", err);
          
          res.download(buffer.filename, function(err){
              fs.unlink(buffer.filename);
            });

        });


        
    
    });
    
    
    
    
    
    app.post('/getter_page', function(req,res){
        var urls = [];
        var next = "";
        
        var url = req.body.url;

        request(url, function(err, resp, body) {
            if (err) throw err;
            
            $ = cheerio.load(body);
            
            $('.entry').each(function(){
                if($(this)['0'].children[1].name == "h2"){
                    urls.push( $(this)['0'].children[1].children[1].attribs.title );
                }
            });

            

            $('.next').each(function(){
                next = $(this)['0'].attribs.href;
            });
            
            
            res.send({urls:urls,next:next});
            
            
        });
    });
    
    
    
    app.post('/getter_song', function(req,res){
        
        request(req.body.url, function(err, resp, body) {
            if (err) throw err;
            
            var data = {title:"", metadata:{}, lines_count:0 };
            $ = cheerio.load(body);
            
            //get title
            $('.diag_box').each(function(){
                if(data.title=="")
                    data.title = $(this)['0'].children[1].children[0].data.trim();
            });
           
           //get mp3
           $('#wtaudiodetailplayer').each(function(){
                var script = $(this)['0'].next.next.children[0].data;
                
                var script = script.split("s1.addVariable(\'file\', \'")[1];
                var mp3 = script.split(".mp3\');\n")[0] +".mp3";
                
                data.mp3 = mp3;
            });
           
            //get meta
            $('.song_taxonomy').each(function(){
                
                var metadatas = $(this)['0'].children;
                for(var metadata_i=0;metadata_i<metadatas.length;metadata_i++){
                    if(metadatas[metadata_i].name=="div"){
                        if(metadatas[metadata_i].children.length){
                            
                            for(var inner_i=0;inner_i<metadatas[metadata_i].children.length;inner_i++){
                                if(metadatas[metadata_i].children[inner_i].name=="p"){
                                    
                                    var this_meta = "";
                                    var this_data = [];
                                    
                                    var inner = metadatas[metadata_i].children[inner_i].children;
                                    
                                    for(var inner_j=0;inner_j<inner.length;inner_j++){
                                        
                                        if(inner[inner_j].type=="tag"){
                                            if(inner[inner_j].name=="strong"){
                                                this_meta = inner[inner_j].children[0].data.trim();
                                                var re = new RegExp(":", 'g');
                                                this_meta = this_meta.replace(re, '');
                                                
                                            }else if(inner[inner_j].name=="a"){
                                                if(inner[inner_j].children[0].data.trim()!="")
                                                    this_data.push( inner[inner_j].children[0].data.trim() );
                                            }
                                        }else if(this_data==""){
                                            if(inner[inner_j].data.trim()!="")
                                                this_data.push( inner[inner_j].data.trim() );
                                        }
                                    }
                                    
                                    data.metadata[this_meta] = this_data;
                                }
                            }
                            
                        }
                            
                    }
                }
                
            });
            
            var output_string = "";
            
            $('.chord-pro-disp').each(function(){
                
                var new_song_part = true;
                
                var array_lines = $(this)['0'].children;
                
                for(var line_i=0;line_i<array_lines.length;line_i++){
                    if(array_lines[line_i].name=="div"){
                        
                        
                        if(array_lines[line_i].attribs.class=="chord-pro-line"){
                            var array_segments = array_lines[line_i].children;
                            for(var segment_i=0;segment_i<array_segments.length;segment_i++){
                                if(array_segments[segment_i].name=="div"){
                                    
                                    var chords_lyrics_divs = array_segments[segment_i].children;
                                    for(var chords_lyrics_i=0;chords_lyrics_i<chords_lyrics_divs.length;chords_lyrics_i++){
                                        if(chords_lyrics_divs[chords_lyrics_i].name=="div"){
                                            
                                            if(chords_lyrics_divs[chords_lyrics_i].attribs.class=="chord-pro-note"){
                                                if(chords_lyrics_divs[chords_lyrics_i].children.length){
                                                    //console.log( chords_lyrics_divs[chords_lyrics_i].children[0].data );
                                                    output_string+= '['+chords_lyrics_divs[chords_lyrics_i].children[0].data+']';
                                                }
                                            }
                                            if(chords_lyrics_divs[chords_lyrics_i].attribs.class=="chord-pro-lyric"){
                                                if(chords_lyrics_divs[chords_lyrics_i].children.length){
                                                    var lyrics = chords_lyrics_divs[chords_lyrics_i].children[0].data;
                                                    //console.log( lyrics );
                                                    
                                                    if( new_song_part && lyrics.indexOf("Intro")>-1 ){
                                                        output_string+= "_I:";
                                                        new_song_part = false;
                                                    }
                                                    else if( new_song_part && lyrics.indexOf("Chorus")>-1 ){
                                                        output_string+= "_C:";
                                                        new_song_part = false;
                                                    }
                                                    else if( new_song_part && lyrics.indexOf("Pre-Chorus")>-1 ){
                                                        output_string+= "_P:";
                                                        new_song_part = false;
                                                    }
                                                    else if( new_song_part && lyrics.indexOf("Verse")>-1 ){
                                                        output_string+= "_V:";
                                                        new_song_part = false;
                                                    }
                                                    else if( new_song_part && lyrics.indexOf("Bridge")>-1 ){
                                                        output_string+= "_B:";
                                                        new_song_part = false;
                                                    }
                                                    else if( new_song_part && lyrics.indexOf("Refrain")>-1 ){
                                                        output_string+= "_R:";
                                                        new_song_part = false;
                                                    }
                                                    else{
                                                        output_string+= lyrics;
                                                    }
                                                    
                                                    
                                                }
                                            }
                                            
                                        }
                                    }
                                    
                                }
                            }
                            
                            data.lines_count++;
                            output_string+= "\n";
                            
                        }else if(array_lines[line_i].attribs.class=="chord-pro-br"){
                            if(!new_song_part){
                                new_song_part = true;
                            }
                            
                        }
                    }
                }
                
            });
            
            data.raw = output_string;
            
            
            
            data.lyrics = "";
            data.lines_count = 0;
            
            var parts = data.raw.split("_");
            parts.shift();
            
            parts.forEach(function(part){
                
                var this_para = "";
                
                part = part.slice(2,part.length);
                
                var lines = part.split("\n");
                data.lines_count+= lines.length;
                lines.forEach(function(line){
                    
                    if(line!=''){
                        var arrStr = line.split(/[\[\]]+/);
                        var this_line = "";
                        
                        for(var i=0;i<arrStr.length;i++){
                            var temp_lyrics = arrStr[i].trim();
                            
                            if(i%2===0 && temp_lyrics!=""){
                                this_line+= temp_lyrics+" ";
                            }
                        }
                        if(this_line!=""){
                            this_para+= this_line+'<br/>';
                        }
                        
                    }
                });
                
                if(this_para!=""){
                    data.lyrics+= '<p>'+this_para+'</p>';
                }
                    
            });
            
            
            
            if(data.metadata['Original Key(s)'])
                data.basekey = data.metadata['Original Key(s)'][0];
            else{
                data.basekey = "";
            }
            
            Song.collection.insert(data, onInsert);
            function onInsert(err, status) {
                if (err) {
                    console.log("some errors on insert ",data.title);
                }
                res.send(data);
            }
            
            
            
        });
        
    });
    
    
    
    
    
    
    
    app.post('/extract_docx', function(req,res){
        var html = null;
        var messages = null;
        mammoth.convertToHtml({path: "./../sample.docx"})
            .then(function(result){
                html = result.value;
                messages = result.messages;
                
                var re = new RegExp(" ", 'g');
                html2 = html.replace(re, '&nbsp;');
                
                var lines = html.split("<p>");
                lines.forEach(function(line){
                    
                    //determine type
                    // contain bold, or has more than half is in caps and there are more chars than spaces
                    if( (line.indexOf("<strong>")!=-1 || (line.replace(/[^A-Z]/g, "").length/line.replace(/\s/g, "").length > 0.5) ) && (line.replace(/\s/g, "").length/line.length > 0.5) ){
                        console.log(line, line.indexOf("<strong>"), (line.replace(/[^A-Z]/g, "").length/line.length > 0.5) , (line.replace(/\s/g, "").length/line.length > 0.8)  );
                    }
                    //console.log(line, line.indexOf("<strong>"), line.replace(/[^A-Z]/g, "").length, line.length, line.replace(/\s/g, "").length, (line.replace(/[^A-Z]/g, "").length/line.replace(/\s/g, "").length > 0.5) , (line.replace(/\s/g, "").length/line.length > 0.5)  );
                    
                });
                
                //str = "ThIs Is A Test On HOW tO counT UppeR CaSE";
                //console.log(str.replace(/[^A-Z]/g, "").length);
                
                
                res.send({html:html2,messages:messages});
            })
            .done();
    });
    
    
    
    /*
    function raw_to_html(song, callback){

        song.body = "";
        song.lyrics = "";
        var verse_counter = 1;
        song.lines_count = 0;
        
        var parts = song.raw.split("_");
        parts.shift();
        
        parts.forEach(function(part){
            
            song.lyrics+= '<p>';
            
            if(part.substring(0, 1) == "C"){
                song.body+= "<div class='chorus'><span class='badge badge-success'>Chorus</span>";
            }else if(part.substring(0, 1) == "V"){
                song.body+= "<div class='verses'><span class='badge badge-primary'>Verse "+verse_counter+"</span>";
                verse_counter++;
            }else if(part.substring(0, 1) == "B"){
                song.body+= "<div class='bridge'><span class='badge badge-info'>Bridge</span>";
            }
            
            part = part.slice(2,part.length);
            
            var lines = part.split("\n");
            song.lines_count+= lines.length;
            lines.forEach(function(line){
                
                if(line!=''){
                    song.body+= '<p class="lyric">';
                    
                    var arrStr = line.split(/[\[\]]+/);
                    
                    for(var i=0;i<arrStr.length;i++){
                        if(i%2===0){
                            song.body+= arrStr[i];
                            song.lyrics+= arrStr[i];
                        }else{
                            transpose({basekey:song.basekey, tokey:song.thiskey, thiskey:arrStr[i]}, function(newkey) {
                                song.body+= '<span class="chord"><span class="inner">'+ newkey +'</span></span>';
                            });
                        }
                    }
                    song.body+= '</p>';
                    song.lyrics+= '<br/>';
                }
            });
            
            song.body+= "</div>";
            song.lyrics+= '</p>';
        });
        
        callback(song);
    }
    
    
    function transpose(query, callback){
        
        var keys_table = {
            "C": ["C","D","E","F","G","A","Bb"],
            "D": ["D","E","F#","G","A","B","C"],
            "E": ["E","F#","G#","A","B","C#","D"],
            "F": ["F","G","A","Bb","C","D","Eb"],
            "G": ["G","A","B","C","D","E","F"],
            "A": ["A","B","C#","D","E","F#","G"],
            "B": ["B","C#","D#","E","F#","G#","A"],
            "Bb": ["Bb","C","D","Eb","F","G","G#"],
        };
        
        var this_keys = keys_table[query.basekey];
        var that_keys = keys_table[query.tokey];
        
        var done_n = [];
        var newkey = query.thiskey;

        for(i in this_keys){
            var count = 0;
            while(count < newkey.length){
                var n = newkey.indexOf(this_keys[i]);
                if(n>-1 && !(n in done_n)){
                    done_n.push(n);
                    newkey = newkey.substring(0, n) + that_keys[i] + newkey.substring(n+this_keys[i].length, newkey.length);
                }
                count++;
            }
            
        }
        callback(newkey);
    }
    */
    
/*
_C:[D]Bless the [G]Lord, O my [D]soul, [A/C#]O my [Bm]soul\n
[G]Worship His [D]holy [Asus4 - A]name\n
Sing like [G]never be[Bm]fore, [G]O [A]my [Bm]soul\n
[G]I'll worship Your [A]holy [G/D - D]name

_V:The [G]sun comes [D]up, it's a [A]new day [Bm]dawning\n
[G]It's time to [D]sing Your [A]song a-[Bm]gain\n
What-[G]ever may [D]pass\n
And what-[A]ever lies be-[Bm]fore me\n
[G2]Let me be [D]singing \n
When the [Asus4 - A]even - ing [D]comes.

_V:You're [G]rich in [D]love, and You're [A]slow to [Bm]anger\n
Your [G]name is [D]great, and [A]Your heart is [Bm]kind\n
For [G]all Your [D]goodness, I will [A]keep on [Bm]singing\n
[G2]Ten thousand [D]reasons \n
For my [Asus4]heart [A]to [D]find

_V:And [G]on that [D]day when my [A]strength is [Bm]failing\n
The [G]end draws [D]near, and my [A]time has [Bm]come\n
[G]Still my [D]soul will sing Your [A]praise un-[Bm]ending\n
[G2]Ten thousand [D]years \n
And then for - [Asus4 - A]e -- ver - [D]more!
*/
    
}