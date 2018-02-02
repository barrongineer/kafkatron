<template>
    <v-app top-navbar>
        <header>
            <v-navbar>
                <v-navbar-logo>Connections</v-navbar-logo>
            </v-navbar>
        </header>
        <main>
            <v-content>
                <v-container fluid>
                    <transition mode="out-in">
                        <v-list>
                            <v-list-item v-for="c in connections">
                                <v-list-tile>
                                    <v-list-tile-action>
                                        <v-btn v-dropdown="{value: c._id}" icon ripple>
                                            <v-icon>more_vert</v-icon>
                                        </v-btn>
                                    </v-list-tile-action>

                                    <v-dropdown :id="c._id">
                                        <v-dropdown-item @click.native.stop="edit(c)">Edit</v-dropdown-item>
                                        <v-dropdown-item @click.native="remove(c)">Remove</v-dropdown-item>
                                    </v-dropdown>

                                    <v-list-tile-content>
                                        <v-list-tile-title v-text="c.name"></v-list-tile-title>
                                        <v-list-tile-sub-title>{{c.zkHost}}:{{c.zkPort}}</v-list-tile-sub-title>
                                    </v-list-tile-content>

                                    <v-spacer></v-spacer>

                                    <v-list-tile-action @click.native="selectConnection(c)">
                                        <v-list-tile-avatar>
                                            <v-icon id="storage-icon" class="grey white--text">arrow_forward</v-icon>
                                        </v-list-tile-avatar>
                                    </v-list-tile-action>
                                </v-list-tile>
                            </v-list-item>
                        </v-list>
                    </transition>
                </v-container>
            </v-content>

            <v-btn id="add-connection-btn"
                   @click.native.stop="add"
                   v-tooltip:left="{ html: 'New Connection' }"
                   floating
                   large
                   info
                   ripple>
                <v-icon>add</v-icon>
            </v-btn>

            <v-modal id="connection-modal">
                <v-card style="word-wrap: break-word;">
                    <v-card-row class="blue darken-1">
                        <v-card-title>
                            <span class="white--text">Connection</span>
                        </v-card-title>
                    </v-card-row>

                    <v-card-text>
                        <v-text-input
                                id="connection-name"
                                name="connection-name"
                                label="Name"
                                v-model="connection.name">
                        </v-text-input>

                        <v-text-input
                                id="connection-zkhost"
                                name="connection-zkhost"
                                label="ZooKeeper Host"
                                v-model="connection.zkHost">
                        </v-text-input>

                        <v-text-input
                                type="number"
                                id="connection-zkport"
                                name="connection-zkport"
                                label="ZooKeeper Port"
                                v-model="connection.zkPort">
                        </v-text-input>

                        <v-text-input
                                id="connection-groupid"
                                name="connection-groupid"
                                label="Group ID"
                                v-model="connection.groupId">
                        </v-text-input>
                    </v-card-text>

                    <v-card-row actions>
                        <v-spacer></v-spacer>
                        <v-btn @click.native.stop="$vuetify.bus.pub('modal:close:connection-modal')">
                            Cancel
                        </v-btn>

                        <v-btn v-if="operation == 'add'" @click.native.stop="addConnection"
                               id="submit-btn"
                               class="blue white--text">
                            Save
                        </v-btn>

                        <v-btn v-if="operation == 'edit'" @click.native.stop="updateConnection"
                               id="submit-btn"
                               class="blue white--text">
                            Save
                        </v-btn>
                    </v-card-row>
                </v-card>
            </v-modal>
        </main>
    </v-app>
</template>

<script>
    var ipcRenderer = require('electron').ipcRenderer;

    export default {
        components: {},

        name: 'connections',

        created () {
            var _this = this;
            console.log('Retrieving connections...');

            ipcRenderer.on('FIND_ALL_CONNECTIONS', function (event, connections) {
                console.log('received response from FIND_ALL_CONNECTIONS');
                console.log('connections: ' + connections.length);
                connections.forEach(c => {
                    console.log('name: ' + c.name);
                });

                _this.connections = connections;
            });

            ipcRenderer.on('PRODUCER_READY', function (event, response) {
                console.log('received response from ZK_CONNECT');
                _this.$router.replace('main');
            });

            ipcRenderer.send('FIND_ALL_CONNECTIONS');
        },

        data () {
            return {
                connections: {},
                connection: {},
                operation: 'add'
            }
        },

        methods: {
            addConnection: function (event) {
                console.log('Adding the new connection...');

                ipcRenderer.send('SAVE_CONNECTION', this.connection);
                ipcRenderer.send('FIND_ALL_CONNECTIONS');

                this.closeModal();
            },

            updateConnection: function (event) {
                ipcRenderer.send('UPDATE_CONNECTION', this.connection);
                ipcRenderer.send('FIND_ALL_CONNECTIONS');

                this.closeModal();
            },

            selectConnection: function (connection) {
                console.log(`Selected connection: ${connection.name}`);

                ipcRenderer.send('ZK_CONNECT', connection);
            },

            add: function (event) {
                console.log('Opening the add connection modal...');

                this.operation = 'add';
                this.connection = {};

                this.openModal();
            },

            edit: function (connection) {
                console.log(`Editing connection: ${connection.name}`);
                this.connection = connection;
                this.operation = 'edit';

                this.openModal();
            },

            remove: function (connection) {
                console.log(`Removing connection: ${connection.name}`);

                ipcRenderer.send('DELETE_CONNECTION', connection);
                ipcRenderer.send('FIND_ALL_CONNECTIONS');
            },

            openModal: function () {
                this.$vuetify.bus.pub('modal:open:connection-modal')
            },

            closeModal: function () {
                this.$vuetify.bus.pub('modal:close:connection-modal')
            }
        }
    }
</script>

<style scoped>
    #add-connection-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
    }

    #submit-btn {
        margin-left: 20px;
    }

    .card__row--actions {
        border-top: none;
    }

    #storage-icon {
        padding-top: 8px;
    }

    .card {
        word-wrap: break-word;
    }
</style>