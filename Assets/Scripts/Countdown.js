//countdownTimer: methods to handle a countdown timer
//it is always assumed that there is a guiText item available for the display output
// from http://forum.unity3d.com/threads/19106-Code-Sample-Countdown-Timer

//PRIVATE MEMBERS
private var b_timer_active : boolean; //switch to start/stop timer
private var f_timer_done:function(); //method to be called when timer runs down
private var countdownEndTime:float;
private var countdownLength:float;
private var countdownTimeLeft:float;

//PUBLIC METHODS
function IsActive() {
	return b_timer_active;
}


function TimeLeft() { //get the time remaining on the clock
	return countdownTimeLeft;
}


function OnFinish(f_method_fp) { //set the method to be called when the timer is done
	f_timer_done = f_method_fp;
}


function SetClockPosition(pos:Vector2) {
	GetComponent.<GUIText>().pixelOffset = pos;
}


function SetCountdownLength(t:float) { //set the starting value for the countdown
	b_timer_active = false;
	countdownLength = t;
	countdownTimeLeft = countdownLength;
}


function StartCountdown() { //set the active state of the timer
	b_timer_active = true;
	countdownEndTime = Time.time + countdownLength;
}


function Update() {
	if (b_timer_active) { //check to see if the timer is "on"
		if (!GetComponent.<GUIText>()) { //check for an available GUIText component
			Debug.Log("countdownTimer needs a GUIText component!");
			enabled = false;
			return;
		} else {
			doCountdown(); //decrement the time and send value to GUIText for output
		}
	}
}

//PRIVATE METHODS
private function doCountdown() { //
	if(countdownLength) { //make sure that we had a starting time value before conting down
		countdownTimeLeft = countdownEndTime - Time.time;
		if(countdownTimeLeft <= 0) {
			print("why is it " + countdownTimeLeft + "?");
		}
		countdownTimeLeft = Mathf.Max(0, countdownTimeLeft); //don't let the time fall below 0.0
		GetComponent.<GUIText>().text = outReadableTime(countdownTimeLeft); //display the time to the GUI
		if (countdownTimeLeft == 0.0) { //if time has run out, deactivate the timer and call the followup method
			b_timer_active = false;
			if (f_timer_done) { //only call the followup method if we had one
				f_timer_done();
			}
		}
	} else {
		Debug.Log("countdownTimer needs a value set for fl_time_left");
	}
}

private function outReadableTime(timeVal:float) { //format the floating point seconds to M:S
	var i_seconds:int = timeVal;
	var i_millis:float = timeVal - i_seconds;
	var s_timetext:String = "";
	if(10 > i_seconds) {
		s_timetext = "0" + i_seconds.ToString() + i_millis.ToString("#.000");
	}
	
	return s_timetext;
}
