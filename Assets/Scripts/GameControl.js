var gameHUDPrefab:Transform = null;

////////////// CONSTANTS
private var ROUND_COUNTDOWN = 0.75;
private var TIEBREAKER_COUNTDOWN = 0.6;
private var NUM_QUICKPLAY_ROUNDS = 42;


////////////// VARIABLES
// game state
enum GameStates {PLAYERPROMPT, GAME};
private var myGameState:GameStates = GameStates.PLAYERPROMPT;
private var readyForPlayerInput = false;

// game type
enum GameType {QUICK, ENDURANCE};
private var myGameType:GameType;

// sounds
var sndBeep:AudioClip = null;
var sndBuzz:AudioClip = null;
var sndFaster:AudioClip = null;
var sndGoodAnswer:AudioClip = null;
var sndNoPlayer:AudioClip = null;
var sndOne:AudioClip = null;
var sndPlayerOne:AudioClip = null;
var sndPlayerTwo:AudioClip = null;
var sndPlayerThree:AudioClip = null;
var sndPlayerFour:AudioClip = null;
var sndSilence:AudioClip = null;
var sndTada:AudioClip = null;
var sndTiebreaker:AudioClip = null;
var sndThree:AudioClip = null;
var sndTopScore:AudioClip = null;
var sndTwo:AudioClip = null;
var sndWilhelm:AudioClip = null;
var sndWins:AudioClip = null;

// the GUI
private var guiTransform:Transform = null;
private var roundHUD:GUIText = null;

// countdown clock variables
private var countdownActive = false;
private var countdownEnd = 0;
private var previousClockSeconds = 0;

// per-player variables
private var playerGUIText:GUIText[] = new GUIText[5];
private var playerReady:boolean[] = new boolean[5];
private var playerPoints:int[] = new int[5];

// skrud or pizza
enum Card {SKRUD, PIZZA, SKRUDZZA};
private var roundCard:Card;
private var isAsking:boolean;
private var isShowingScreen:boolean;
private var playerAnswers:int[];
private var roundCounter:int;
private var tiebreaker:boolean = false;
private var winnerSelected:boolean = false;
var pictureScreen:Transform = null;
var skrudPictures:Texture[] = null;
var pizzaPictures:Texture[] = null;
var skrudzzaPicture:Texture = null;
private var showedSkrudzza = false;
private var skrudzzaProbability = 0.01;

private var MIN_FLASHCARD_SPEED = 0.5;
private var flashcardspeed:float = 5;
private var countingfraction:float = 0;

// high scores
private var highScoreName:String = "";
private var gotFullHighScore:boolean = false;
private var gettingHighScores:boolean = false;


///////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////

function SetQuickPlay() {
	myGameType = GameType.QUICK;
}


function SetEndurancePlay() {
	myGameType = GameType.ENDURANCE;
}


function InitialiseEverything() {
	// get all HUD elements
	var components = guiTransform.GetComponentsInChildren(GUIText);
	for(var guitext:GUIText in components) {
		if("Player1" == guitext.name) {
			guitext.text = "Player 1\nReady? 1, 2";
			playerGUIText[1] = guitext;
		} else if("Player2" == guitext.name) {
			guitext.text = "Player 2\nReady? d, f";
			playerGUIText[2] = guitext;
		} else if("Player3" == guitext.name) {
			guitext.text = "Player 3\nReady? j, k";
			playerGUIText[3] = guitext;
		} else if("Player4" == guitext.name) {
			guitext.text = "Player 4\nReady? 9, 0";
			playerGUIText[4] = guitext;
		} else if("RoundHUD" == guitext.name) {
			guitext.text = "";
			roundHUD = guitext;
		} else {
			Debug.Log("Starting on weird player number thing.");
		}
	}
	
	for(var i:int in playerPoints) {
		i = 0;
	}
	
	// move countdown clock wherever
	GetComponent.<GUIText>().pixelOffset = Vector2(Screen.width / 2, Screen.height/2);

	// default starting values
	isAsking = false;
	tiebreaker = false;
	winnerSelected = false;
	myGameState = GameStates.PLAYERPROMPT;
	readyForPlayerInput = false;
	gettingHighScores = false;
	flashcardspeed = ROUND_COUNTDOWN;
	countingfraction = 0.75;
	showedSkrudzza = false;
	for(var i=1; i <= 4; ++i) {
		playerReady[i] = false;
	}
	
	// fade in the player prompts
	iTween.FadeFrom(gameObject, {"alpha":0.0, "time":1.0, "oncomplete":"StartJoinCountdown"});
}


function StartJoinCountdown() {
	countdownActive = true;
	countdownEnd = Time.time + 10.0;
	previousClockSeconds = 10;
	readyForPlayerInput = true;
}


function CountdownFinished() {
	// change the players' text based on whether or not they are activated
	if(playerReady[1]) {
		playerGUIText[1].text = "Player 1\nOkay!";
	} else {
		playerGUIText[1].text = "Player 1\nInfinite Shame!";
		playerGUIText[1].material.color.a = 0.25;
	}
	if(playerReady[2]) {
		playerGUIText[2].text = "Player 2\nOkay!";
	} else {
		playerGUIText[2].text= "Player 2\nInfinite Shame!";
		playerGUIText[2].material.color.a = 0.25;
	}
	if(playerReady[3]) {
		playerGUIText[3].text = "Player 3\nOkay!";
	} else {
		playerGUIText[3].text = "Player 3\nInfinite Shame!";
		playerGUIText[3].material.color.a = 0.25;
	}
	if(playerReady[4]) {
		playerGUIText[4].text = "Player 4\nOkay!";
	} else {
		playerGUIText[4].text = "Player 4\nInfinite Shame!";
		playerGUIText[4].material.color.a = 0.25;
	}
	
	// housekeeping
	countdownActive = false;
	readyForPlayerInput = false;
	
	// make sure at least one player joined up
	if(playerReady[1] || playerReady[2] || playerReady[3] || playerReady[4]) {
		
		GetComponent.<GUIText>().text = "GAME IS YES!";
		GetComponent.<AudioSource>().PlayOneShot(sndTada);
		
		yield WaitForSeconds(2.0);
		
		AreYouAreReady();
	} else {	// no active player, go back to menu
		GetComponent.<AudioSource>().PlayOneShot(sndNoPlayer);
		GetComponent.<GUIText>().text = "WHAT NO READY";
		yield WaitForSeconds(2.0);
		Camera.main.SendMessage("ReturnToMenu");
		EndGame();
	}
}


function AreYouAreReady() {
	// set up players
	if(playerReady[1]) {
		playerGUIText[1].text = "Player 1\n0 POINTS\n1=skrud\n2=pizza";
	}
	if(playerReady[2]) {
		playerGUIText[2].text = "Player 2\n0 POINTS\nd=skrud\nf=pizza";
	}
	if(playerReady[3]) {
		playerGUIText[3].text = "Player 3\n0 POINTS\nj=skrud\nk=pizza";
	}
	if(playerReady[4]) {
		playerGUIText[4].text = "Player 4\n0 POINTS\n9=skrud\n0=pizza";
	}
	
	GetComponent.<GUIText>().text = "ARE YOU ARE READY?";
	yield WaitForSeconds(3.0);
	
	StartRoundSequence();
}


function StartRoundSequence() {
	roundCounter = 0;
	myGameState = GameStates.GAME;
	roundHUD.text = "Round 0/" + NUM_QUICKPLAY_ROUNDS;
	roundHUD.pixelOffset.x = Screen.width / 2;
}


function UpdatePlayerPrompt() {
	// if we're still waiting on player input, see if any player logs in
	if(readyForPlayerInput) {
		if(!playerReady[1] && (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Alpha2))) {
			GetComponent.<AudioSource>().PlayOneShot(sndPlayerOne);
			playerReady[1] = true;
			playerGUIText[1].material.color = Color.red;
		}
		if(!playerReady[2] && (Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.F))) {
			GetComponent.<AudioSource>().PlayOneShot(sndPlayerTwo);
			playerReady[2] = true;
			playerGUIText[2].material.color = Color.green;
		}
		if(!playerReady[3] && (Input.GetKeyDown(KeyCode.J) || Input.GetKeyDown(KeyCode.K))) {
			GetComponent.<AudioSource>().PlayOneShot(sndPlayerThree);
			playerReady[3] = true;
			playerGUIText[3].material.color = Color.blue;
		}
		if(!playerReady[4] && (Input.GetKeyDown(KeyCode.Alpha9) || Input.GetKeyDown(KeyCode.Alpha0))) {
			GetComponent.<AudioSource>().PlayOneShot(sndPlayerFour);
			playerReady[4] = true;
			playerGUIText[4].material.color = Color.yellow;
		}
		
		// check if we should say "beep" for the countdown clock
		if(countdownActive) {
			var timeLeft:float = countdownEnd - Time.time;
			var clockSeconds:int = timeLeft;
			if(previousClockSeconds != clockSeconds) {
				previousClockSeconds = clockSeconds;
				if(previousClockSeconds < 10) {
					GetComponent.<AudioSource>().PlayOneShot(sndBeep);
				}
			}

			// set the GUIText to something
			var i_seconds:int = timeLeft;
			var i_millis:float = timeLeft - i_seconds;
			var s_timetext:String = "";
			if(10 > i_seconds) {
				s_timetext = "0" + i_seconds.ToString() + i_millis.ToString("#.000");
			}
			GetComponent.<GUIText>().text = s_timetext;
			
			if(0 >= timeLeft) {
				CountdownFinished();
			}
		}
	}
}


private function QuestionRound() {
	while(true) {
		// initialise round
		isShowingScreen = false;
		playerAnswers = new int[5];
		for(var i:int in playerAnswers) {
			i = -1;
		}
		
		++roundCounter;
		if(GameType.ENDURANCE == myGameType) {
			roundHUD.text = "Round " + roundCounter;
		} else {
			roundHUD.text = "Round " + roundCounter + "/" + NUM_QUICKPLAY_ROUNDS;
		}
	
		// play a 3-2-1 countdown
		GetComponent.<AudioSource>().PlayOneShot(sndThree);
		GetComponent.<GUIText>().text = "3";
		yield WaitForSeconds(sndThree.length * countingfraction);
		GetComponent.<AudioSource>().PlayOneShot(sndTwo);
		GetComponent.<GUIText>().text = "2";
		yield WaitForSeconds(sndTwo.length * countingfraction);
		GetComponent.<AudioSource>().PlayOneShot(sndOne);
		GetComponent.<GUIText>().text = "1";
		yield WaitForSeconds(sndOne.length * countingfraction);
		GetComponent.<GUIText>().text = "";
		
		// skrud or pizza?!?
		if(Random.value < 0.5) {
			roundCard = Card.SKRUD;
		} else {
			roundCard = Card.PIZZA;
		}
		
		// random probability of Skrudzza!
		if(!showedSkrudzza) {
			if(Random.value < skrudzzaProbability) {
				showedSkrudzza = true;
				roundCard = Card.SKRUDZZA;
			}
		}
		
		// create the image!
		isShowingScreen = true;
		var picture:Transform = Instantiate(pictureScreen, Vector3(0, 0, 5), Quaternion.identity);
		picture.transform.Rotate(Vector3(90, 180, 0));
		if(Card.SKRUD == roundCard) {
			picture.GetComponent.<Renderer>().material.mainTexture = skrudPictures[Random.value * skrudPictures.length];
		} else if(Card.PIZZA == roundCard) {
			picture.GetComponent.<Renderer>().material.mainTexture = pizzaPictures[Random.value * pizzaPictures.length];
		} else if(Card.SKRUDZZA == roundCard) {
			picture.GetComponent.<Renderer>().material.mainTexture = skrudzzaPicture;
			GetComponent.<AudioSource>().PlayOneShot(sndWilhelm);
		} else {
			Debug.Log("WTF WEIRD CARD CHOSEN");
		}
		
		// let people get their votes in
		yield WaitForSeconds(flashcardspeed);
		
		Destroy(picture.gameObject);
		
		isShowingScreen = false;
		
		// check if any players haven't answered
		var noanswer = false;
		noanswer |= CheckPlayerNonAnswer(1);
		noanswer |= CheckPlayerNonAnswer(2);
		noanswer |= CheckPlayerNonAnswer(3);
		noanswer |= CheckPlayerNonAnswer(4);
		if(noanswer) {
			GetComponent.<AudioSource>().PlayOneShot(sndBuzz);
		}
	
		// checks to do at the end of a round
		if(GameType.QUICK == myGameType) {
			yield DoQuickplayTests();
		} else if(GameType.ENDURANCE == myGameType) {
			yield DoEnduranceTests();
		} else {
			Debug.Log("WTF WEIRD GAME TYPE");
		}
		
		isAsking = false;
		
		break;
	}
}


private function CheckPlayerAnswer(id:int, skrudbutton:KeyCode, pizzabutton:KeyCode) {
	if(-1 == playerAnswers[id]) {
		if(Input.GetKeyDown(skrudbutton)) {	// they answered Skrud
			playerAnswers[id] = Card.SKRUD;
			if(Card.SKRUD == roundCard) {	// good answer
				GetComponent.<AudioSource>().PlayOneShot(sndGoodAnswer);
				++playerPoints[id];
				if(1 == id) {
					playerGUIText[1].text = "Player 1\n"+playerPoints[1]+" POINTS\n1=skrud\n2=pizza";
				} else if(2 == id) {
					playerGUIText[2].text = "Player 2\n"+playerPoints[2]+" POINTS\nd=skrud\nf=pizza";
				} else if(3 == id) {
					playerGUIText[3].text = "Player 3\n"+playerPoints[3]+" POINTS\nj=skrud\nk=pizza";
				} else if(4 == id) {
					playerGUIText[4].text = "Player 4\n"+playerPoints[4]+" POINTS\n9=skrud\n0=pizza";
				} else {
					Debug.Log("WTF WHOSE POINTAGE ID");
				}
			} else if(Card.PIZZA == roundCard || Card.SKRUDZZA == roundCard) {	// bad answer
				if(playerReady[id]) {
					iTween.ShakePosition(playerGUIText[id].gameObject, Vector3(0.05, 0.05, 0.05), 0.5);
					GetComponent.<AudioSource>().PlayOneShot(sndBuzz);
				}
			} else {
				Debug.Log("WTF WRONG ANSWER BITCH " + roundCard);
			}
		} else if(Input.GetKeyDown(pizzabutton)) {
			playerAnswers[id] = Card.PIZZA;
			if(Card.PIZZA == roundCard) {	// good answer
				GetComponent.<AudioSource>().PlayOneShot(sndGoodAnswer);
				++playerPoints[id];
				if(1 == id) {
					playerGUIText[1].text = "Player 1\n"+playerPoints[1]+" POINTS\n1=skrud\n2=pizza";
				} else if(2 == id) {
					playerGUIText[2].text = "Player 2\n"+playerPoints[2]+" POINTS\nd=skrud\nf=pizza";
				} else if(3 == id) {
					playerGUIText[3].text = "Player 3\n"+playerPoints[3]+" POINTS\nj=skrud\nk=pizza";
				} else if(4 == id) {
					playerGUIText[4].text = "Player 4\n"+playerPoints[4]+" POINTS\n9=skrud\n0=pizza";
				} else {
					Debug.Log("WTF WHOSE POINTAGE ID");
				}
			} else if(Card.SKRUD == roundCard || Card.SKRUDZZA == roundCard) {
				if(playerReady[id]) {
					iTween.ShakePosition(playerGUIText[id].gameObject, Vector3(0.05, 0.05, 0.05), 0.5);
					GetComponent.<AudioSource>().PlayOneShot(sndBuzz);
				}
			} else {			
				Debug.Log("WTF WRONG PIZZA ANSWER BITCH" + roundCard);
			}
		}
	}
}


private function CheckPlayerNonAnswer(id) {
	if(playerReady[id] && -1 == playerAnswers[id] && playerReady[id]) {
		if(Card.SKRUDZZA != roundCard) {
			iTween.ShakePosition(playerGUIText[id].gameObject, Vector3(0.05, 0.05, 0.05), 0.5);
			return true;
		} else { 	// skrudzza!	// good answer
			GetComponent.<AudioSource>().PlayOneShot(sndGoodAnswer);
			++playerPoints[id];
			if(1 == id) {
				playerGUIText[1].text = "Player 1\n"+playerPoints[1]+" POINTS\n1=skrud\n2=pizza";
			} else if(2 == id) {
				playerGUIText[2].text = "Player 2\n"+playerPoints[2]+" POINTS\nd=skrud\nf=pizza";
			} else if(3 == id) {
				playerGUIText[3].text = "Player 3\n"+playerPoints[3]+" POINTS\nj=skrud\nk=pizza";
			} else if(4 == id) {
				playerGUIText[4].text = "Player 4\n"+playerPoints[4]+" POINTS\n9=skrud\n0=pizza";
			} else {
				Debug.Log("WTF WHOSE POINTAGE ID");
			}
			return false;
		}
	}
	return false;
}


private function DoQuickplayTests() {
	// check for distinct winner
	var maxscore = 0;
	if(playerPoints[1] > maxscore) maxscore = playerPoints[1];
	if(playerPoints[2] > maxscore) maxscore = playerPoints[2];
	if(playerPoints[3] > maxscore) maxscore = playerPoints[3];
	if(playerPoints[4] > maxscore) maxscore = playerPoints[4];
	
	yield CheckForSpeedup();
	
	if(tiebreaker || (!tiebreaker && NUM_QUICKPLAY_ROUNDS <= roundCounter)) {
		var numwinners = 0;
		if(playerPoints[1] < maxscore) {
			playerGUIText[1].text = "Player 1\nInfinite Shame!";
			playerGUIText[1].material.color.a = 0.25;
			playerReady[1] = false;
		} else ++numwinners;
		if(playerPoints[2] < maxscore) {
			playerGUIText[2].text = "Player 2\nInfinite Shame!";
			playerGUIText[2].material.color.a = 0.25;
			playerReady[2] = false;
		} else ++numwinners;
		if(playerPoints[3] < maxscore) {
			playerGUIText[3].text = "Player 3\nInfinite Shame!";
			playerGUIText[3].material.color.a = 0.25;
			playerReady[3] = false;
		} else ++numwinners;
		if(playerPoints[4] < maxscore) {
			playerGUIText[4].text = "Player 4\nInfinite Shame!";
			playerGUIText[4].material.color.a = 0.25;
			playerReady[4] = false;
		} else ++numwinners;
	
		if(1 == numwinners) {	// declare winner
			winnerSelected = true;
			if(maxscore == playerPoints[1]) {
				GetComponent.<GUIText>().text = "PLAYER 1\nWINS!";
				GetComponent.<AudioSource>().PlayOneShot(sndPlayerOne);
				yield WaitForSeconds(sndPlayerOne.length);
			} else if(maxscore == playerPoints[2]) {
				GetComponent.<GUIText>().text = "PLAYER 2\nWINS!";
				GetComponent.<AudioSource>().PlayOneShot(sndPlayerTwo);
				yield WaitForSeconds(sndPlayerTwo.length);
			} else if(maxscore == playerPoints[3]) {
				GetComponent.<GUIText>().text = "PLAYER 3\nWINS!";
				GetComponent.<AudioSource>().PlayOneShot(sndPlayerThree);
				yield WaitForSeconds(sndPlayerThree.length);
			} else if(maxscore == playerPoints[4]) {
				GetComponent.<GUIText>().text = "PLAYER 4\nWINS!";
				GetComponent.<AudioSource>().PlayOneShot(sndPlayerFour);
				yield WaitForSeconds(sndPlayerFour.length);
			}
			GetComponent.<AudioSource>().PlayOneShot(sndWins);
			yield WaitForSeconds(sndWins.length * 2.0);
			Camera.main.SendMessage("ReturnToMenu");
			EndGame();
			
		} else if(!tiebreaker) {	// otherwise tiebreakers!
			winnerSelected = true;
			tiebreaker = true;
			GetComponent.<GUIText>().text = "TIEBREAKER!";
			flashcardspeed = Mathf.Max(flashcardspeed, TIEBREAKER_COUNTDOWN);
			GetComponent.<AudioSource>().PlayOneShot(sndTiebreaker);
			yield WaitForSeconds(sndTiebreaker.length);
			winnerSelected = false;
		}
	}
}


private function DoEnduranceTests() {
	var numwinners = 0;
	if(playerPoints[1] < roundCounter) {
		playerGUIText[1].text = "Player 1\nInfinite Shame!";
		playerGUIText[1].material.color.a = 0.25;
		playerReady[1] = false;
	} else ++numwinners;
	if(playerPoints[2] < roundCounter) {
		playerGUIText[2].text = "Player 2\nInfinite Shame!";
		playerGUIText[2].material.color.a = 0.25;
		playerReady[2] = false;
	} else ++numwinners;
	if(playerPoints[3] < roundCounter) {
		playerGUIText[3].text = "Player 3\nInfinite Shame!";
		playerGUIText[3].material.color.a = 0.25;
		playerReady[3] = false;
	} else ++numwinners;
	if(playerPoints[4] < roundCounter) {
		playerGUIText[4].text = "Player 4\nInfinite Shame!";
		playerGUIText[4].material.color.a = 0.25;
		playerReady[4] = false;
	} else ++numwinners;
	
	yield CheckForSpeedup();
	
	if(0 == numwinners) {	// everyone lost, this is the end
		winnerSelected = true;
		GetComponent.<GUIText>().text = "TOP SCORE!\n" + (roundCounter-1) + " POINTS!";
		GetComponent.<AudioSource>().PlayOneShot(sndTopScore);
		Camera.main.GetComponent(OverlordScript).PollHighScores();
		yield WaitForSeconds(sndTopScore.length * 1.5);
		
		var script:OverlordScript = Camera.main.gameObject.GetComponent("OverlordScript");
		
		// does player 1 have a top score?
		if(script.IsHighScore(playerPoints[1])) {
			GetComponent.<GUIText>().text = "PLAYER 1 IS NAME:\n";
			highScoreName = "";
			gettingHighScores = true;
			gotFullHighScore = false;
			while(!gotFullHighScore) {
				yield;
			}
			script.AddHighScore(playerPoints[1], highScoreName);
			gettingHighScores = false;
		}
		
		// does player 2 have a top score?
		if(script.IsHighScore(playerPoints[2])) {
			GetComponent.<GUIText>().text = "PLAYER 2 IS NAME:\n";
			highScoreName = "";
			gettingHighScores = true;
			gotFullHighScore = false;
			while(!gotFullHighScore) {
				yield;
			}
			script.AddHighScore(playerPoints[2], highScoreName);
			gettingHighScores = false;
		}
		
		// does player 3 have a top score?
		if(script.IsHighScore(playerPoints[3])) {
			GetComponent.<GUIText>().text = "PLAYER 3 IS NAME:\n";
			highScoreName = "";
			gettingHighScores = true;
			gotFullHighScore = false;
			while(!gotFullHighScore) {
				yield;
			}
			script.AddHighScore(playerPoints[3], highScoreName);
			gettingHighScores = false;
		}
		
		// does player 4 have a top score?
		if(script.IsHighScore(playerPoints[4])) {
			GetComponent.<GUIText>().text = "PLAYER 4 IS NAME:\n";
			highScoreName = "";
			gettingHighScores = true;
			gotFullHighScore = false;
			while(!gotFullHighScore) {
				yield;
			}
			script.AddHighScore(playerPoints[4], highScoreName);
			gettingHighScores = false;
		}
		
		
		// completely done, go back to menu
		Camera.main.SendMessage("ReturnToMenu");
		EndGame();
	}
}


private function CheckForSpeedup() {
	if(roundCounter % 10 == 0 && roundCounter != 0) {
		if(flashcardspeed - 0.05 >= MIN_FLASHCARD_SPEED) {
			flashcardspeed -= 0.05;
			countingfraction = Mathf.Max(countingfraction - 0.05, 0.65);
			GetComponent.<AudioSource>().PlayOneShot(sndFaster);
			GetComponent.<GUIText>().text = "FASTER!";
			yield WaitForSeconds(sndFaster.length);
		}
	}
}


private function UpdateGame() {
	if(!isAsking && !winnerSelected) {
		isAsking = true;
		QuestionRound();
	}
		
	// if we're showing the screen, poll for user input
	if(isShowingScreen) {
		CheckPlayerAnswer(1, KeyCode.Alpha1, KeyCode.Alpha2);
		CheckPlayerAnswer(2, KeyCode.D, KeyCode.F);
		CheckPlayerAnswer(3, KeyCode.J, KeyCode.K);
		CheckPlayerAnswer(4, KeyCode.Alpha9, KeyCode.Alpha0);
	}
	
	// if getting high scores
	if(gettingHighScores) {
		var gotbutton:boolean = false;
		if(Input.GetKeyDown(KeyCode.A)) {
			highScoreName += "A";
			GetComponent.<GUIText>().text += "A";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.B)) {
			highScoreName += "B";
			GetComponent.<GUIText>().text += "B";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.C)) {
			highScoreName += "C";
			GetComponent.<GUIText>().text += "C";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.D)) {
			highScoreName += "D";
			GetComponent.<GUIText>().text += "D";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.E)) {
			highScoreName += "E";
			GetComponent.<GUIText>().text += "E";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.F)) {
			highScoreName += "F";
			GetComponent.<GUIText>().text += "F";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.G)) {
			highScoreName += "G";
			GetComponent.<GUIText>().text += "G";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.H)) {
			highScoreName += "H";
			GetComponent.<GUIText>().text += "H";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.I)) {
			highScoreName += "I";
			GetComponent.<GUIText>().text += "I";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.J)) {
			highScoreName += "J";
			GetComponent.<GUIText>().text += "J";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.K)) {
			highScoreName += "K";
			GetComponent.<GUIText>().text += "K";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.L)) {
			highScoreName += "L";
			GetComponent.<GUIText>().text += "L";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.M)) {
			highScoreName += "M";
			GetComponent.<GUIText>().text += "M";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.N)) {
			highScoreName += "N";
			GetComponent.<GUIText>().text += "N";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.O)) {
			highScoreName += "O";
			GetComponent.<GUIText>().text += "O";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.P)) {
			highScoreName += "P";
			GetComponent.<GUIText>().text += "P";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.Q)) {
			highScoreName += "Q";
			GetComponent.<GUIText>().text += "Q";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.R)) {
			highScoreName += "R";
			GetComponent.<GUIText>().text += "R";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.S)) {
			highScoreName += "S";
			GetComponent.<GUIText>().text += "S";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.T)) {
			highScoreName += "T";
			GetComponent.<GUIText>().text += "T";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.U)) {
			highScoreName += "U";
			GetComponent.<GUIText>().text += "U";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.V)) {
			highScoreName += "V";
			GetComponent.<GUIText>().text += "V";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.W)) {
			highScoreName += "W";
			GetComponent.<GUIText>().text += "W";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.X)) {
			highScoreName += "X";
			GetComponent.<GUIText>().text += "X";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.Y)) {
			highScoreName += "Y";
			GetComponent.<GUIText>().text += "Y";
			gotbutton = true;
		}
		if(Input.GetKeyDown(KeyCode.Z)) {
			highScoreName += "Z";
			GetComponent.<GUIText>().text += "Z";
			gotbutton = true;
		}
		
		if(gotbutton) {
			if(highScoreName.length >= 3) {
				gotFullHighScore = true;
			}
		}
	}
}


function EndGame() {
	var movetime:float = 0.5;
	iTween.MoveTo(gameObject, {"position":Vector3(0, 0, -80), "time":movetime});
	iTween.FadeTo(gameObject, {"alpha":0.0, "time":movetime});
	yield WaitForSeconds(movetime);
	Destroy(gameObject);
}


///////////////////////////////////////////////////////////////
// UNITY FUNCTIONS
///////////////////////////////////////////////////////////////

function Start() {
	// create the game HUD
	guiTransform = Instantiate(gameHUDPrefab, Vector3.zero, Quaternion.identity);
	guiTransform.parent = transform;
	
	InitialiseEverything();
}


function Update() {
	if(GameStates.PLAYERPROMPT == myGameState) {
		UpdatePlayerPrompt();
	} else if(GameStates.GAME == myGameState) {
		UpdateGame();
	}
}
