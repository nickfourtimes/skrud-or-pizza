var titleScreen:Transform = null;
var menuScreen:Transform = null;
var gameScreen:Transform = null;
var highScoreScreen:Transform = null;

var sndWhoosh:AudioClip = null;


///////////////////////////////////////////////////////////////////////////////
// PRIVATE DATA
///////////////////////////////////////////////////////////////////////////////

// how we store the high scores
private var mHighScores:int[] = null;

private var mShowingHighScores = false;


//////////////////////////////////////////////////////////
// MESSAGES FROM GAME MODES
//////////////////////////////////////////////////////////

function TitleCardFinished() {
	//print("Baby baby gimme that sweet lovin' lemme HOLD you all night.");
	Instantiate(menuScreen, Vector3(0, 0, 0), Quaternion.identity);
}


function SelectQuickPlay() {
	GetComponent.<AudioSource>().PlayOneShot(sndWhoosh);
	var game:Transform = Instantiate(gameScreen, Vector3(0, 0, 0), Quaternion.identity);
	game.SendMessage("SetQuickPlay");
}


function SelectEndurancePlay() {
	GetComponent.<AudioSource>().PlayOneShot(sndWhoosh);
	var game:Transform = Instantiate(gameScreen, Vector3(0, 0, 0), Quaternion.identity);
	game.SendMessage("SetEndurancePlay");
}


function SelectHighScores() {
	GetComponent.<AudioSource>().PlayOneShot(sndWhoosh);
	yield ShowHighScores();
}


function ReturnToMenu() {
	GetComponent.<AudioSource>().PlayOneShot(sndWhoosh);
	Instantiate(menuScreen, Vector3(0, 0, 0), Quaternion.identity);
}


///////////////////////////////////////////////////////////////////////////////
// HIGH SCORE STUFF
///////////////////////////////////////////////////////////////////////////////

function IsHighScore(score:float) {
	for(var i=0; i < 10; ++i) {
		if(score > mHighScores[i]) {
			return true;
		}
	}
	return false;
}


function PollHighScores() {
	// fetch the high scores
	var obj:HighScore = Camera.main.GetComponent(HighScore);
	obj.getScores();
	
	// wait a tick to get the scores
	var scores:String = "";
	while("" == obj.allScores) {
		yield;
	}
	scores = obj.allScores;
	
	// see if our new score is a high score
	mHighScores = new int[10];
	var allscores = scores.Split("\n"[0]);
	var highscore = false;
//	for(var i=0; i < 10; ++i) {
//		var onescore = allscores[i].Split("\t"[0]);
//		mHighScores[i] = parseInt(onescore[1]);
//	}
}


function AddHighScore(score:float, myname:String) {
	var index:int;
	var i:int;
	
	var obj:HighScore = Camera.main.GetComponent(HighScore);
	obj.postScore(score, myname);
}


private function ShowHighScores() {
	// get the gui ready
	GetComponent.<GUIText>().pixelOffset = Vector2(Screen.width/2, Screen.height/2);
	GetComponent.<GUIText>().material.color.a = 1.0;
	GetComponent.<GUIText>().text = "Internetting...";

	// tell our high score module to get the high scores
	var obj:HighScore = Camera.main.GetComponent(HighScore);
	obj.getScores();
	
	// wait a tick to get the scores
	var scores:String = "";
	while("" == obj.allScores) {
		yield;
	}
	scores = obj.allScores;

	// put the text in the scores
	mShowingHighScores = false;
	GetComponent.<GUIText>().text = "MAXIMAL POINTAGE";
	GetComponent.<GUIText>().text += "\n" + scores;
	
	// fade the text in
	var movetime:float = 1.0;
	iTween.FadeFrom(gameObject, {"alpha":0.0, "time":movetime});
	yield WaitForSeconds(movetime);
	mShowingHighScores = true;
}


private function EndHighScores() {
	var movetime:float = 1.0;
	mShowingHighScores = false;
	iTween.FadeTo(gameObject, {"alpha":0.0, "time":movetime});
	yield WaitForSeconds(movetime);
}


//////////////////////////////////////////////////////////
// UNITY FUNCTIONS
//////////////////////////////////////////////////////////

function Start() {
	PollHighScores();

	Instantiate(titleScreen, Vector3(0, 0, 0), Quaternion.identity);
	//Instantiate(menuScreen, Vector3(0, 0, 0), Quaternion.identity);
	//var game:Transform = Instantiate(gameScreen, Vector3(0, 0, 0), Quaternion.identity); game.SendMessage("SetQuickPlay");
}


function Update() {
	if(mShowingHighScores) {
		if(Input.GetButtonDown("Enter")) {				
			Camera.main.SendMessage("ReturnToMenu");
			EndHighScores();
		}
	}
}
