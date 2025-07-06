import Pterodactyl from "pterodactyl-api-wrapper";
const { Application, Client, Setup } = Pterodactyl;

Setup.setPanel(process.env.PTERODACTYL_PANEL_URL!);

const app = new Application(process.env.PTERODACTYL_API_KEY!);
const client = new Client(process.env.PTERODACTYL_CLIENT_API_KEY!);

const ipMappings = {
    "hostnode.hack.pet": "mc1.hack.pet",
    "hostnode2.hack.pet": "mc2.hack.pet",
    "hostnode3.hack.pet": "mc3.hack.pet",
    "10.130.15.208": "mc2.hack.pet",
    "10.164.0.5": "mc1.hack.pet",
    "10.128.0.9": "mc3.hack.pet"
}

export { app, client, ipMappings }; 