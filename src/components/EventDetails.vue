<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import L from "leaflet"; //Leaflet for OSM
import "leaflet/dist/leaflet.css"; // Füge Leaflet CSS hinzu
import {
    buildAddressObject,
    buildImagesObject,
    buildSchedule,
} from "../functions/eventFunctions.js";

const EVENT_API_URL =
    "https://data.carinthia.com/api/v4/endpoints/557ea81f-6d65-6476-9e01-d196112514d2?token=9962098a5f6c6ae8d16ad5aba95afee0&include=image,location,organizer,eventSchedule&filter[q]=";

const route = useRoute();
const myEvent = ref();
const mainImg = ref();

/**
 * To not expose the token Query-Param to users of the website
 * a better way would be that the FE calls a BE which fetches the data via the API
 */
onMounted(async () => {
    // get slug from url and get data.
    // theoretically, slug should be unique and filtering for an id does not work somehow...
    let slugFromUrl = route.params.slug;
    let data = await (await fetch(EVENT_API_URL + slugFromUrl)).json();
    myEvent.value = buildEventObject(data["@graph"][0]);
    mainImg.value = myEvent.value.images[0];
});

// After myEvent is updated, check if not null
// wait for dom to finish update and initialise map
watch(myEvent, async (newValue) => {
    if (newValue != null) {
        await nextTick();
        initialiseOSM();
    }
});

function initialiseOSM() {
    //set view and zoom on map
    const map = L.map("map").setView(
        [myEvent.value.address.geo_lat, myEvent.value.address.geo_long],
        17
    );

    //add tile layer to map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    //add marker + popup to map (and also open it)
    L.marker([myEvent.value.address.geo_lat, myEvent.value.address.geo_long])
        .addTo(map)
        .bindPopup(
            `<b>${myEvent.value.address.name ? myEvent.value.address.name : "Veranstaltungsort"
            }</b><br />${myEvent.value.address?.street != null ? myEvent.value.address.street : ""
            }
            ${myEvent.value.address?.zipCode != null
                ? "<br />" + myEvent.value.address?.zipCode
                : ""
            }
            ${myEvent.value.address?.locality != null
                ? " " + myEvent.value.address.locality
                : ""
            }`
        )
        .openPopup();
}

/**
 * EVENT
 * Title
 * Description
 * Address
 * "Tag"
 * Image
 * Termin
 * Schedule --> wird nur beim Detail Display benötigt
 */

function buildEventObject(_event) {
    return {
        title: _event.name,
        description: _event.description,
        images: buildImagesObject(_event),
        address: buildAddressObject(_event),
        slug: _event["dc:slug"],
        tags: "",
        schedule: buildSchedule(_event),
    };
}

function setMainImage(image) {
    mainImg.value = image;
}
</script>

<template>
    <div class="container">
        <div class="event-item event-detail" v-if="myEvent != null">
            <div class="core-info">
                <div class="event-headline">
                    <h2>{{ myEvent.title }}</h2>
                </div>
                <div class="location-and-date-info">
                    <div class="date" v-if="myEvent.schedule != null">
                        <font-awesome-icon class="font-awesome-icon" :icon="['far', 'calendar-days']" />{{
                            myEvent.schedule[0]?.startDate }}
                    </div>
                    <div class="time" v-if="myEvent.schedule != null">
                        <font-awesome-icon class="font-awesome-icon" :icon="['far', 'clock']" />
                        {{ myEvent.schedule[0]?.startTime }}
                        <span v-if="myEvent.schedule[0]?.endTime != null">
                            &nbsp;-&nbsp;{{ myEvent.schedule[0].endTime }}</span>
                    </div>
                    <div class="place" v-if="myEvent.address != null && (myEvent.address.name != null || myEvent.address.locality != null)">
                        <font-awesome-icon class="font-awesome-icon" :icon="['fas', 'location-dot']" />
                        <span v-if="myEvent.address.name != null"> {{ myEvent.address.name }}</span>
                        <span v-else-if="myEvent.address.locality != null">{{
                            myEvent.address.locality
                        }}</span>
                    </div>
                </div>
                <div class="content-info">
                    <div class="gallery-container">
                        <div class="image-gallery">
                            <div class="main-image-container">
                                <img :src="mainImg.url" alt="Hauptbild" class="main-image" />
                                <div v-if="mainImg.copyright">
                                    <span class="copyright-icon">&copy;</span><span class="copyright-info">{{
                                        mainImg.copyright }}</span>
                                </div>
                            </div>
                            <div v-if="myEvent.images.length > 1" class="thumbnails-container">
                                <div v-for="(image, index) in myEvent.images" :key="index" class="thumbnail">
                                    <img :src="image.url" :alt="image.name" :class="{ selected: mainImg.url == image.url }"
                                        @click="setMainImage(image)" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-details">
                        <div class="content-description">
                            <div class="fading-text" v-html="myEvent.description"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="further-details">
                <div class="schedule-info">
                    <span>Weitere Termine</span>
                    <div class="schedule">
                        <div class="more-dates" v-for="curDate of myEvent.schedule">
                            <span>{{ curDate.startDate }}</span>
                            <span>&nbsp;{{ curDate.startTime }}</span>
                            <span v-if="curDate.endTime"> - {{ curDate.endTime }}</span>
                        </div>
                    </div>
                </div>
                <div class="location">
                    <div id="map"></div>
                    <div class="address">
                        <span><b> Veranstaltungsort</b></span>
                        <span class="name">{{ myEvent.address.name }}</span>
                        <span class="street">{{ myEvent.address.street }}</span>
                        <span class="city">{{ myEvent.address.locality }} {{ myEvent.address.zipCode }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
