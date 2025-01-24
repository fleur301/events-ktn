<script setup>
import { ref, onMounted } from "vue";
import {
  buildAddressObject,
  buildImagesObject,
  buildSchedule,
} from "../functions/eventFunctions.js";

const EVENT_API_URL =
  "https://data.carinthia.com/api/v4/endpoints/557ea81f-6d65-6476-9e01-d196112514d2?token=9962098a5f6c6ae8d16ad5aba95afee0&include=image,location,organizer,eventSchedule";

const myEvents = ref([]);
const nextPage = ref();

const isLoading = ref(false);

onMounted(async () => {
  loadEvents();
});

/**
 * To not expose the token Query-Param to users of the website
 * a better way would be that the FE calls a BE which fetches the data via the API
 */
async function loadEvents() {
  isLoading.value = true;

  let url = "";

  if (myEvents.value.length == 0) {
    url = EVENT_API_URL;
  } else if (nextPage.value != null) {
    url = nextPage.value;
  }

  if (url != "") {
    let data = await (await fetch(url)).json();

    myEvents.value.push(
      ...data["@graph"].map(buildEventObject) // Füge neue Events hinzu
    );
    nextPage.value = data.links.next;
  }

  isLoading.value = false;
}

function buildEventObject(_event) {
  return {
    id: _event["@id"],
    title: _event.name,
    description: _event.description,
    image: buildImagesObject(_event)[0],
    address: buildAddressObject(_event),
    slug: _event["dc:slug"],
    tag: "",
    startDate: buildSchedule(_event)[0],
  };
}
</script>

<template>
  <div class="container">
    <div class="event-list" id="#event-list">
      <div class="event-item" v-for="(event, index) of myEvents" :key="index">
        <div class="event-headline">
          <h2>{{ event.title }}</h2>
        </div>

        <div class="content-info">
          <div class="gallery-container" v-if="event.image != null">
            <div class="image-gallery">
              <div class="main-image-container">
                <img :src="event.image.url" alt="Hauptbild" class="main-image" />
                <div v-if="event.image.copyright">
                  <span class="copyright-icon">&copy;</span><span class="copyright-info">{{ event.image.copyright
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!--          <div>
            <div class="image-container" v-if="event.image != null">
              <div>
                <img :src="event.image.url" :alt="event.image.name" />
                <div v-if="event.image.copyright" class="">
                  <span class="copyright-icon">&copy;</span><span class="copyright-info">{{ event.image.copyright
                  }}</span>
                </div>
              </div>
            </div>
          </div>-->
          <div class="content-details">
            <div class="location-and-date-info">
              <div class="date">
                <font-awesome-icon class="font-awesome-icon" :icon="['far', 'calendar-days']" />{{
                  event.startDate?.startDate }}
              </div>
              <div class="time" v-if="event.startDate != null">
                <font-awesome-icon class="font-awesome-icon" :icon="['far', 'clock']" />
                {{ event.startDate.startTime }}
                <span v-if="event.startDate.endTime != null">- {{ event.startDate.endTime }}</span>
              </div>
              <div class="place" v-if="event.address != null && event.address.name != null">
                <font-awesome-icon class="font-awesome-icon" :icon="['fas', 'location-dot']" />{{ event.address.name }}
              </div>
              <div v-else-if="event.address != null && event.address.locality != null">
                <font-awesome-icon class="font-awesome-icon" :icon="['fas', 'location-dot']" />{{ event.address.locality
                }}
              </div>
            </div>
            <div class="content-description">
              <div class="fading-text" v-html="event.description"></div>
            </div>

            <router-link :to="{
              name: 'Details',
              params: { slug: event.slug },
            }" class="details-link">
              Mehr Details &nbsp; <font-awesome-icon :icon="['fas', 'arrow-right']" />
            </router-link>
          </div>
        </div>
      </div>
      <button class="btn" v-if="nextPage != null" @click="loadEvents" :disabled="isLoading">
        {{ isLoading ? "Lade..." : "Mehr laden" }}
      </button>

      <a href="#top" class="scroll-top"><font-awesome-icon :icon="['fas', 'arrow-up']" class="font-awesome-icon" /></a>
    </div>
  </div>
</template>
