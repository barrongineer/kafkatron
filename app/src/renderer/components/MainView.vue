<template xmlns:v-bind="http://www.w3.org/1999/xhtml">
    <v-app top-navbar left-sidebar>
        <header>
            <v-navbar>
                <v-navbar-items>
                    <v-navbar-item
                            v-bind:item="{ href: 'javascript:void(0)', icon: 'menu' }"
                            @click.native.stop="toggleSidebar"
                            v-tooltip:right="{html: 'Topics'}">
                    </v-navbar-item>
                    <v-navbar-item
                            v-bind:item="{ href: 'javascript:void(0)', icon: 'flash_on' }"
                            @click.native="closeConnection"
                            v-tooltip:right="{html: 'Connections'}">
                    </v-navbar-item>
                </v-navbar-items>

                <v-spacer></v-spacer>
                <v-navbar-logo>{{topic}}</v-navbar-logo>
            </v-navbar>
        </header>
        <main>
            <v-sidebar id="sidebar"
                       height="85vh"
                       left
                       ripple>
                <v-list>
                    <v-list-item
                            v-for="topic in topics"
                            @click="setTopic(topic)">
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-list-tile-title>{{topic}}</v-list-tile-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list-item>
                </v-list>

                <v-btn id="create-topic-btn"
                       @click.native.stop="openModal"
                       v-tooltip:right="{ html: 'Create Topic' }"
                       floating
                       large
                       info
                       ripple>
                    <v-icon>add</v-icon>
                </v-btn>
            </v-sidebar>
            <v-content>
                <v-container fluid>
                    <transition mode="out-in">
                        <h4 v-if="topic == null">Select a topic</h4>

                        <v-container v-if="topic" fluid="fluid" style="padding: 20px;">
                            <v-row>
                                <v-col xs10="xs10">
                                    <v-text-input
                                            id="message"
                                            name="message"
                                            label="Message"
                                            v-model="message">
                                    </v-text-input>
                                </v-col>

                                <v-col xs2="xs2">
                                    <v-btn info
                                           ripple
                                           @click.native="sendMessage"
                                           style="margin-bottom: 20px;">Send
                                    </v-btn>
                                </v-col>
                            </v-row>

                            <v-row>
                                <v-col xs12="xs12">
                                    <v-checkbox id="clr-msg-chkbx"
                                                name="clr-msg-chkbx"
                                                label="Clear message on send"
                                                v-model="clearMessage"></v-checkbox>
                                </v-col>
                            </v-row>

                            <h4 v-if="messages.length == 0">No new messages.</h4>

                            <div v-for="m in messages" style="text-align: left;">
                                <v-row>
                                    <v-col xs1="xs1">
                                        <span style="font-weight: bold;">{{m.offset}}</span>
                                    </v-col>

                                    <v-col xs11="xs11">
                                        <span>{{m.value}}</span>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-container>
                    </transition>
                </v-container>
            </v-content>

            <v-modal id="newTopic-modal">
                <v-card>
                    <v-card-row class="blue darken-1">
                        <v-card-title>
                            <span class="white--text">Create a New Topic</span>
                        </v-card-title>
                    </v-card-row>

                    <v-card-text>
                        <v-text-input
                                id="topic-name"
                                name="topic-name"
                                label="Name"
                                v-model="newTopic">
                        </v-text-input>
                    </v-card-text>

                    <v-card-row actions>
                        <v-spacer></v-spacer>
                        <v-btn @click.native.stop="$vuetify.bus.pub('modal:close:newTopic-modal')">
                            Cancel
                        </v-btn>

                        <v-btn @click.native.stop="createTopic"
                               id="submit-btn"
                               class="blue white--text">
                            Create
                        </v-btn>
                    </v-card-row>
                </v-card>
            </v-modal>
        </main>
    </v-app>
</template>

<script>
  var ipcRenderer = require('electron').ipcRenderer;

  import CurrentPage from './LandingPageView/CurrentPage'
  import Links from './LandingPageView/Links'
  import Versions from './LandingPageView/Versions'
  export default {
    components: {
      CurrentPage,
      Links,
      Versions
    },

    created () {
        var _this = this;

        ipcRenderer.on('CONNECTION_CLOSED', function () {
            _this.$router.replace('connections');
        });

        ipcRenderer.on('LIST_TOPICS', function (event, response) {
            console.log('received response from LIST_TOPICS');

            if (response.err) {
                console.log(err);
                return
            }

            if (response.results.length > 1) {
                let metadata = response.results[1].metadata;

                let topics = [];
                for (var property in metadata) {
                    if (metadata.hasOwnProperty(property)) {
                        if (property !== '__consumer_offsets') {
                            topics.push(property)
                        }
                    }
                }

                console.log(`topics size: ${topics.length}`);

                _this.topics = topics;
            }
        });

        ipcRenderer.on('TOPIC_CREATED', function (event, response) {
            if (response.err) {
                console.log(`Error: ${err}`);
                return;
            }

            console.log(`TOPIC_CREATED RESPONSE: ${response.data}`);

            setTimeout(function () {
                ipcRenderer.send('LIST_TOPICS');
            }, 2000);
        });

        ipcRenderer.on('MESSAGE_CONSUMED', function (event, message) {
            _this.messages.unshift(message);
        });

        ipcRenderer.send('LIST_TOPICS');
    },

    name: 'landing-page',

    data () {
        return {
            topics: [],
            topic: null,
            message: null,
            messages: [],
            clearMessage: false,
            newTopic: null
        }
    },

    methods: {
        toggleSidebar: function() {
            this.$vuetify.bus.pub('sidebar:toggle:sidebar')
        },

        closeConnection: function() {
            ipcRenderer.send('CLOSE_CONNECTION');
        },

        setTopic: function(topic) {
            console.log(`setting topic to: ${topic}`);

            if (topic !== this.topic) {
                this.topic = topic;

                ipcRenderer.send('CREATE_CONSUMER', topic);
            }
        },

        createTopic: function() {
            console.log(`creating topic: ${this.newTopic}`);

            ipcRenderer.send('CREATE_TOPIC', this.newTopic);

            this.closeModal();
            this.newTopic = null;
        },

        sendMessage: function() {
            console.log(`sending message: ${this.message}`);

            if (this.message) {
                ipcRenderer.send('SEND_MESSAGE', {topic: this.topic, payload: this.message});

                if (this.clearMessage) {
                    this.message = null;
                }
            }
        },

        openModal: function() {
            this.$vuetify.bus.pub('modal:open:newTopic-modal')
        },

        closeModal: function() {
            this.$vuetify.bus.pub('modal:close:newTopic-modal')
        }
    }
  }
</script>

<style scoped>
  img {
    margin-top: -25px;
    width: 450px;
  }

  #create-topic-btn {
    position: fixed;
    bottom: 0;
    right: 10px;
  }

  .list__sub-header {
    font-size: 28px;
    font-weight: bold;
  }

  .list__tile__title {
    font-size: 18px;
  }

  .card {
    word-wrap: break-word;
  }

  .sidebar--open {
    min-width: 300px;
  }

  .card__row--actions {
        border-top: none;
  }

  #submit-btn {
        margin-left: 20px;
    }
</style>
