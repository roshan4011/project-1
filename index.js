console.log("lets go");
let currentsong = new Audio();
let songs;
let currentfolder;

async function getSongs(folder) {
    currentfolder = folder;
    try {
        let a = await fetch(`http://127.0.0.1:5500/songs/${folder}`);
        if (!a.ok) throw new Error(`HTTP error! Status: ${a.status}`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        songs.forEach(song => {
            songUL.innerHTML += `
                <li> 
                    <img class="invert" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Roshan</div>
                    </div>
                    <div class="playNow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
        });

        // Attach event listeners to each li
        Array.from(document.querySelectorAll(".songList li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/songs/${currentfolder}/` + track;
    if (!pause) {
        currentsong.play();
        document.querySelector("#play").src = "img/pause.svg"; // Assuming `play` is an element with id `play`
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
}

const playNextSong = () => {
    let index = songs.indexOf(currentsong.src.split(`/songs/${currentfolder}/`)[1]);
    if (index + 1 < songs.length) {
        playMusic(songs[index + 1]);
    }
}

async function displayAlbums() {
    console.log("displaying albums");
    try {
        let a = await fetch(`http://127.0.0.1:5500/songs`);
        if (!a.ok) throw new Error(`HTTP error! Status: ${a.status}`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors).filter(e => e.href.includes("/songs/") && !e.href.endsWith("/songs/") && !e.href.includes(".htaccess"));

        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            let folder = e.href.split("/").slice(-1)[0];
            try {
                let infoResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                if (!infoResponse.ok) {
                    throw new Error(`HTTP error! Status: ${infoResponse.status}`);
                }
                let infoData = await infoResponse.json();
                cardContainer.innerHTML += ` 
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="http://127.0.0.1:5500/songs/${folder}/cover.jpg" alt="">
                        <h2>${infoData.title}</h2>
                        <p>${infoData.description}</p>
                    </div>`;
            } catch (error) {
                console.error(`Error fetching album info for ${folder}:`, error);
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async event => {
                const dataFolder = e.dataset.folder;
                await getSongs(dataFolder);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error('Error displaying albums:', error);
    }
}


async function main() {
    await getSongs("f1");
    playMusic(songs[0], true);

    await displayAlbums();

    // Attach event listener to play/pause button
    document.querySelector("#play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.querySelector("#play").src = "img/pause.svg";
        } else {
            currentsong.pause();
            document.querySelector("#play").src = "img/play.svg";
        }
    });

    // Update song time and progress
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = secondsToMinutesSeconds(currentsong.currentTime);
        const duration = secondsToMinutesSeconds(currentsong.duration);
        document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seek bar functionality
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // Event listeners for previous and next buttons
    document.querySelector("#previous").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split(`/songs/${currentfolder}/`)[1]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split(`/songs/${currentfolder}/`)[1]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Add event listener to volume range input
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentsong.volume = e.target.value / 100;
    });

    currentsong.addEventListener("ended", playNextSong);

    document.querySelector(".vol>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentsong.volume = .10;
            document.querySelector(".range input").value = 10;
        }
    });

    // space bar to pause and play the music
    document.addEventListener("keypress", e => {
        if (e.key === ' ') {
            if (currentsong.paused) {
                currentsong.play();
                document.querySelector("#play").src = "img/pause.svg";
            } else {
                currentsong.pause();
                document.querySelector("#play").src = "img/play.svg";
            }
        }
    });
}

main();
