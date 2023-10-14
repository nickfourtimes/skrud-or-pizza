using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Serialization;


public class TitleScreenControl : MonoBehaviour {

    // ---------------------------------------------------------------------- DATA MEMBERS

    public GameObject titleCard = null;
    public GameObject worldTournament = null;
    public GameObject pressSpace = null;

    public AudioClip sndSkrudOrPizza = null;
    public AudioClip sndWorldTournament = null;
    public AudioClip sndExplosion = null;

    public Transform explosionPrefab = null;

    private float titleScreenDepth = 40;

    private bool readyForSpace = false;

    // ---------------------------------------------------------------------- METHODS

    IEnumerator BeginTitle() {
        readyForSpace = false;

        var srcAudio = GetComponent<AudioSource> ();

        // rewrite the title card
        var textmesh = titleCard.GetComponent<TextMesh>();
        textmesh.text = "SKRUD\nOR\nPIZZA";

        // make things disappear
        pressSpace.GetComponent<Renderer>().enabled = false;
        worldTournament.GetComponent<Renderer>().enabled = false;

        // move "World Tournament" out of the way for now
        worldTournament.transform.localScale = 0.5f * Vector3.one;
        textmesh = worldTournament.GetComponent<TextMesh> ();
        textmesh.GetComponent<Renderer>().material.color = Color.blue;
        textmesh.text = "WORLD\nTOURNAMENT";

        // say "skrud or pizza" and move the title card in
        var movetime = 2f;
        transform.position = 100 * Vector3.forward;
        GetComponent<AudioSource>().PlayOneShot(sndSkrudOrPizza);
        iTween.FadeFrom (gameObject, iTween.Hash ("alpha", 0f, "time", movetime));
        iTween.MoveTo (gameObject, iTween.Hash ("position", new Vector3 (0, 0, titleScreenDepth), "time", movetime));

        // wait a few seconds and slam the "World Tournament" down
        yield return new WaitForSeconds(2f);
        movetime = 0.5f;
        worldTournament.transform.position = new Vector3(-10, 20, -60);
        worldTournament.GetComponent<Renderer>().enabled = true;
        iTween.MoveTo (worldTournament, iTween.Hash ("position", new Vector3 (10, -12, titleScreenDepth - 3),
            "time", movetime,
            "easetype", "linear"));
        yield return new WaitForSeconds(movetime);
        iTween.ShakePosition(Camera.main.gameObject, 0.5f * Vector3.one, 1f);
        srcAudio.PlayOneShot(sndExplosion);
        srcAudio.PlayOneShot(sndWorldTournament);
        Instantiate (explosionPrefab, new Vector3 (2, -2.25f, 0), Quaternion.identity);

        // wait a tick, fade in the "Press Space"
        yield return new WaitForSeconds(2);
        pressSpace.transform.position = new Vector3(0, -50, 100);
        pressSpace.GetComponent<Renderer>().enabled = true;
        iTween.FadeFrom (pressSpace, iTween.Hash ("alpha", 0.0, "time", 1));
        readyForSpace = true;

        yield break;
    }


    IEnumerator EndTitle() {
        var movetime = 2f;
        iTween.MoveTo (gameObject, iTween.Hash ("position", new Vector3 (0, 0, -80), "time", movetime));
        yield return new WaitForSeconds(movetime);
        Destroy(gameObject);
        yield break;
    }


    // ---------------------------------------------------------------------- UNITY METHODS

    void Start() {
        StartCoroutine (BeginTitle ());
        return;
    }


    void Update() {
        if(readyForSpace) {
            if(Input.GetKeyDown(KeyCode.Return)) {
                readyForSpace = false;
                Camera.main.SendMessage("TitleCardFinished");
                StartCoroutine (EndTitle ());
            }
        }

        return;
    }
}
