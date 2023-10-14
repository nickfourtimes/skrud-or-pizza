private var secretKey="mySecretKey"; // Edit this value and make sure it's the same as the one stored on the server
private static var addScoreUrl="http://www.newton64.ca/games/skrudorpizza/world/as.php?"; //be sure to add a ? to your url
private static var highscoreUrl="http://www.newton64.ca/games/skrudorpizza/world/gs.php"; 

var allScores:String = "";


function postScore(score, myname) {
    //This connects to a server side php script that will add the name and score to a MySQL DB.
    // Supply it with a string representing the players name and the players score.
    var hash=MD5Functions.Md5Sum(myname.ToString() + score.ToString() + "I should hope this is just about secret."); 

    var highscore_url = addScoreUrl + "name=" + WWW.EscapeURL(myname) + "&score=" + score + "&hash=" + hash;
        
    // Post the URL to the site and create a download object to get the result.
    var hs_post = WWW(highscore_url);
    yield hs_post; // Wait until the download is done
    if(hs_post.error) {
        print("There was an error posting the high score: " + hs_post.error);
    }
}


// Get the scores from the MySQL DB to display in a GUIText.
function getScores() {
	allScores = "";
    var hs_get = WWW(highscoreUrl);
    yield hs_get;
    
    if(hs_get.error) {
        allScores = "There was an error getting the high score:\n" + hs_get.error;
    } else {
		allScores = hs_get.text;
    }
}
