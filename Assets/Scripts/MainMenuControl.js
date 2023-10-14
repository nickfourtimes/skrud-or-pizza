var mainGameController:GameObject = null;

// text objects
var txtTitle:GameObject = null;
var txtQuickPlay:GameObject = null;
var txtEndurancePlay:GameObject = null;
var txtHighScores:GameObject = null;

// text object base positions
private var txtQuickPlayPos:Vector3;
private var txtEndurancePlayPos:Vector3;
private var txtHighScorePos:Vector3;

// sounds
var sndBloop:AudioClip = null;

// selection
private var selection = 1;

private var acceptingInput:boolean = false;


///////////////////////////////////////////////////////////////
// GAME STATE FUNCTIONS
///////////////////////////////////////////////////////////////

function StartMainMenu() {
	acceptingInput = false;

	var textmesh:TextMesh;
	var menuitemsZ = 30;

	// put all the menu items into position
	transform.position = Vector3(0, 0, 100);
	txtTitle.GetComponent.<Renderer>().material.color = Color.blue;		// game title
	txtTitle.transform.position += Vector3(0, 10, 0);
	textmesh = txtTitle.GetComponent(TextMesh);
	textmesh.text = "Skrud Or Pizza?";
	txtQuickPlay.transform.position += Vector3(0, 2, menuitemsZ);		// Quick Play
	textmesh = txtQuickPlay.GetComponent(TextMesh);
	textmesh.text = "Quick Play";
	txtEndurancePlay.transform.position += Vector3(0, -8, menuitemsZ);	// Endurance Play
	textmesh = txtEndurancePlay.GetComponent(TextMesh);
	textmesh.text = "Endurance Play";
	txtHighScores.transform.position += Vector3(0, -18, menuitemsZ);		// High Scores
	textmesh = txtHighScores.GetComponent(TextMesh);
	textmesh.text = "High Scores";
	
	// get the base positions
	txtQuickPlayPos = txtQuickPlay.transform.position - Vector3(0, 0, 60);
	txtEndurancePlayPos = txtEndurancePlay.transform.position - Vector3(0, 0, 60);
	txtHighScorePos = txtHighScores.transform.position - Vector3(0, 0, 60);
	
	// move the menu to the right distance and fade it in while doing so
	iTween.MoveTo(gameObject, {"position":Vector3(0, 0, 40), "time":1});
	iTween.FadeFrom(gameObject, {"alpha":0, "time":1, "oncomplete":"HighlightSelection"});
	yield WaitForSeconds(1.0);
	acceptingInput = true;
}


/** Highlight the proper selection. */
function HighlightSelection() {
	// first, blank all the selections
	txtQuickPlay.GetComponent.<Renderer>().material.color = Color.white;
	txtEndurancePlay.GetComponent.<Renderer>().material.color = Color.white;
	txtHighScores.GetComponent.<Renderer>().material.color = Color.white;
	
	// move all the selections back where they belong.
	txtQuickPlay.transform.position = txtQuickPlayPos;
	txtEndurancePlay.transform.position = txtEndurancePlayPos;
	txtHighScores.transform.position = txtHighScorePos;
	
	// remove all "bouncy" scripts
	var script:BouncyScript = txtQuickPlay.GetComponent("BouncyScript");
	if(script) {
		script.SendMessage("NoBounce");
	}
	
	script = txtEndurancePlay.GetComponent("BouncyScript");
	if(script) {
		script.SendMessage("NoBounce");
	}
	
	script = txtHighScores.GetComponent("BouncyScript");
	if(script) {
		script.SendMessage("NoBounce");
	}
	
	// now, figure out which selection is selected, make it red, and make it bounce bounce bounce cha.
	var menuitem:GameObject = null;
	if(1 == selection) {
		menuitem = txtQuickPlay;
	} else if(2 == selection) {
		menuitem = txtEndurancePlay;
	} else if(3 == selection) {
		menuitem = txtHighScores;
	} else {
		Debug.Log("HOLY HELL WHAT SELECTION IS THIS?@?!?!");
	}
	menuitem.GetComponent.<Renderer>().material.color = Color.red;
	menuitem.AddComponent.<BouncyScript>();
}


function EndMainMenu() {
	acceptingInput = false;
	var movetime:float = 2.0;
	iTween.MoveTo(gameObject, {"position":Vector3(0, 0, -80), "time":movetime});
	yield WaitForSeconds(movetime);
	Destroy(gameObject);
}


///////////////////////////////////////////////////////////////
// UNITY FUNCTIONS
///////////////////////////////////////////////////////////////

function Start() {
	// start out of everyone's way
	transform.position = Vector3(0, 0, -40);
	StartMainMenu();
}


function Update() {
	if(acceptingInput) {
        var num:int = 2;
		if(Input.GetKeyDown(KeyCode.UpArrow)) {
			GetComponent.<AudioSource>().PlayOneShot(sndBloop);
			if(0 >= --selection) {
				selection = num;
			}
			HighlightSelection();
		} else if(Input.GetKeyDown(KeyCode.DownArrow)) {
			GetComponent.<AudioSource>().PlayOneShot(sndBloop);
			if(num < ++selection) {
				selection = 1;
			}
			HighlightSelection();
		} else if(Input.GetKeyDown(KeyCode.LeftArrow)) {
		} else if(Input.GetKeyDown(KeyCode.RightArrow)) {
		} else if(Input.GetKeyDown(KeyCode.Return)) {
			if(1 == selection) {
				Camera.main.SendMessage("SelectQuickPlay");
			} else if(2 == selection) {
				Camera.main.SendMessage("SelectEndurancePlay");
			} else if(3 == selection) {
				Camera.main.SendMessage("SelectHighScores");
			} else {
				Debug.Log("HOLY HELL BAD TIME SELECTION");
			}
			EndMainMenu();
		}
	}
}