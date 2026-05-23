## Provision OCP Gym and Setup

To reserve the OCP Gymnasium environment, follow these steps:

1. Visit the [OCP Gym Reservation Page](https://techzone.ibm.com/collection/ocp-gymnasium/environments) on Techzone.
2. Choose your `Geography`, set your `Datastore size` (5TB), and enable `VPN Access`
3. Once the environment is provisioned, install [WireGuard](https://itunes.apple.com/us/app/wireguard/id1451685025?ls=1&mt=12) if not already installed.
4. Download the WireGuard VPN configuration file from your reservation page in Techzone.
5. In WireGuard, select `Import Tunnel(s) From File...` and choose the downloaded `conf_wg_download` file.
6. Activate your tunnel.

> **Note**
>
> There might be some issues caused by using both IBM VPN and the WireGuard VPN at the same time.

---

## Bastion

OCP gym will automatically provision a bastion host running RHEL 8.7. However, this will not work
as a bastion for a private docker registry and you will see errors if you try to do so. Provision
a separate RHEL 9 VM as a bastion with adequate storage (at least 120gb).

Also keep in mind that the bastion sizing requirements are not the same as the nodes. You can get
away with a 4x16 bastion node without an issue.

---

## Before you start

Note that this uses AWS resources that are outside the AWS free tier. The cost to run an AIOps cluster can be significant.

You will need an IBM entitlement key to install AIOps. This can be obtained [here](https://myibm.ibm.com/products-services/containerlibrary).

---

## Define Terraform variables

Under `tf-code`, create a file called `terraform.tfvars`. Set variables here according to
your needs. It is **highly recommended** to set `common_prefix` to something meaningful and unique within your AWS account.

| Var   | Required | Desc |
| ------- | ------- | ----------- |
| `vpc_id` | `no`        | set your vpc-id. If one is not set, one will be created. You can find your vpc_id in your AWS console (Example: vpc-xxxxx) |
| `cluster_name` | `yes`        | the name of your K3s cluster. Default: k3s-cluster |
| `environment`  | `yes`  | Current work environment (Example: staging/dev/prod). This value is used for tag all the deployed resources |
| `common_prefix`  | `no`  | Prefix used in all resource names/tags. Default: k3s |
| `aws_region`  | `yes`  | AWS region to use (e.g. `us-east-1`) |
| `ibm_entitlement_key` | `yes` | The installation entitlement key for AIOps |
| `accept_license` | `yes` | Set to "true" to accept license. |
| `aiops_version` | `yes` | Set to the version you want to install (e.g. "4.9.0") |
| `ignore_prereqs` | `no` | If set to `true` the installation will continue even if prerequisites are not met. |
| `k3s_server_desired_capacity` | `no`        | Desired number of k3s servers. Default 3 |
| `k3s_worker_desired_capacity` | `no`        | Desired number of k3s workers. Default 7 |

---

## Deploy

We are now ready to deploy our infrastructure. First we ask terraform to plan the execution with:

```
terraform plan
```

If everything is ok the output should be something like this:

```
Plan: 81 to add, 0 to change, 0 to destroy.
```

Now deploy our resources with:

```
terraform apply
```

Sample output:
```
Apply complete! Resources: 81 added, 0 changed, 0 destroyed.

Outputs:

aiops_etc_hosts = <<EOT
100.24.19.63 aiops-cpd.ec2-100-24-19-63.compute-1.amazonaws.com
100.24.19.63 cp-console-aiops.ec2-100-24-19-63.compute-1.amazonaws.com
EOT
bastion_public_dns = "ec2-44-203-98-105.compute-1.amazonaws.com"
bastion_public_ip = "44.203.98.105"
```

---

## Bastion host

There is a bastion host created that is to be used to access all other instances and resources inside the VPC.
Use the following command to login to the bastion host from the `tf-code` directory.

```
ssh -o StrictHostKeyChecking=no -i ./id_rsa ec2-user@$(terraform output -raw bastion_public_dns)
```

From the bastion host, you should be able to ssh to any other instance using key authentication (`ssh <ip-or-host>`) from the `ec2-user`.

---

## Check progress of installation

From the bastion host, ssh to any of the control plane nodes found in the output of `k3s_server_private_ips`.

Then change to the root user on the control plane node.

```
sudo su -
```

Run the `aiopsctl` command to see the installation status.

```
# aiopsctl status
o- [10 Apr 25 17:28 UTC] Getting cluster status
Control Plane Node(s):
    i-049164a5150aacaf2.ec2.internal Ready
    i-076d8e147d8745433.ec2.internal Ready

  12 Unready Components
    aiopsui
    cluster

  3 Ready Components
    commonservice
    kafka

  [WARN] AIOps installation unhealthy
```

The install can take up to 45 minutes to complete.

---

## Helpful commands during install

All commands below should be run as root from a control plane node.

List the nodes:
```
oc get nodes
```

Sample output:
```
NAME                               STATUS   ROLES                       AGE   VERSION
i-049164a5150aacaf2.ec2.internal   Ready    control-plane,etcd,master   12m   v1.31.6+k3s1
i-057c2e19b07846245.ec2.internal   Ready    <none>                      13m   v1.31.6+k3s1
```

List all pods that are in unhealthy state:
```
oc get pods -A | grep -vE 'Completed|([0-9]+)/\1'
```

Sample output (unhealthy pods are expected during install):
```
NAMESPACE   NAME                                          READY   STATUS             RESTARTS   AGE
aiops       aiops-ir-analytics-cassandra-setup-crfz7     0/1     CrashLoopBackOff   5          7m2s
```

Follow the launch template script output:
```
tail -f /var/log/cloud-init-output.log
```
This can be run from any node, it will show the verbose output of the launch scripts.

---

## Create VMs

> **Note**
>
> If you have previously defined a VM template, you can use that image under `template-shared` folder instead of installing RHEL and defining a new VM.

To create your VMs:

1. Download the RHEL 9 iso from [Red Hat](https://developers.redhat.com/products/rhel/download)
2. Go to your vCenter Console
3. Log in with the credentials found in your Techzone Reservation
4. Upload your RHEL 9 iso to your datastore
5. Create a new VM in your `Gym Member Resource Pool`
6. Select name and folder
7. Select compute resource
8. Select storage
9. Select compatibility
10. Select guest OS
11. Customize hardware

- 16 core CPU
- 64 GB memory
- New Network
  - enable `Connect At Power On`
  - enable `DirectPath I/O`
- New CD/DVD Drive
  - choose `Datastore ISO File`
  - enable `Connect at Power On`
  - choose the `RHEL 9 iso` uploaded to the datastore in previous step

12. Click `Finish` and wait for the VM to build
13. Start the VM, launch `Web Console` and start RHEL 9 Installation
14. Once install completes, connect to Red Hat with your Red Hat credentials
15. Choose the installation destination, select the disk and `custom` to configure the disk layout. Click Done. Move all the storage from `/home` mount point to `/` and remove the `/home` mount point.
16. Set the Root Password
17. Create a user `gymuser`
18. Begin installation
19. Once complete, reboot system. After reboot, shutdown the VM.

---

## Create a Template From VM

Now create a template from the VM you just created in order to quickly spin up VM clones without having to reregister.

1. Choose the VM you just created and click `Clone To Template`
2. Name your template and place it in your resource
3. Select your compute resource
4. Select storage
5. Finish up
6. Spin up a new VM using that template. You can run two clone jobs at the same time, so you can start both worker node builds one after the other. Don't forget to spin up an additional bastion host if you plan on doing an offline install that requires a private docker registry.

---

## DNS Configuration

### Node DNS Configuration

Proper DNS name resolution needs to be configured for all nodes in the cluster. The following
section describes how this is done in pfSense.

For each VM, we must create a new DNS Forward entry.

1. Go to `192.168.252.1` in your browser

   - Username: admin
   - Password: the password provided in Techzone

2. Go to `Services/DNS Forwarder`
3. Go to `Host Overrides` and click `+ Add`
4. Update `Host Overrides Options`

   - Domain will always be `gym.lan`
   - Use IP Address of the VM

5. Save and hit `Apply Changes`
6. SSH into the VM and update hostname

- `# ssh root@<ip address>` password is from Techzone
- Run the following command:
  - `# hostnamectl hostname <host>.<domain>`

### Server Node Ingress Configuration

It is necessary to add additional host name aliases to one of the server nodes in order for the name resolution to allow ingress to the AIOps UI. Any server node can be used as the ingress node.

For example, if our server node is called `server-node-01` with IP address `10.10.10.10` in domain `gym.lan`, then we would add two host aliases to the existing DNS forwarding record for `server-node-01`.

```
10.10.10.10 aiops-cpd.server-node-01.gym.lan
10.10.10.10 cp-console-aiops.server-node-01.gym.lan
```

---

## Open Ports on Control Plane and Workers

To open the necessary ports on your control plane and worker nodes:

1. SSH in to your **control plane** and run the following commands:

```sh
firewall-cmd --add-port=80/tcp --zone=public --permanent
firewall-cmd --add-port=6443/tcp --zone=public --permanent
firewall-cmd --add-port=8443/tcp --zone=public --permanent
firewall-cmd --add-port=8472/udp --zone=public --permanent
firewall-cmd --add-source=10.42.0.0/16 --zone=trusted --permanent
firewall-cmd --add-source=10.43.0.0/16 --zone=trusted --permanent
firewall-cmd --reload
firewall-cmd --list-ports
```

2. SSH in to each of your **worker nodes** and run the following commands:

```sh
firewall-cmd --add-port=6443/tcp --zone=public --permanent
firewall-cmd --add-port=8472/udp --zone=public --permanent
firewall-cmd --add-source=10.42.0.0/16 --zone=trusted --permanent
firewall-cmd --add-source=10.43.0.0/16 --zone=trusted --permanent
firewall-cmd --reload
firewall-cmd --list-ports
```

---

## Local SSH Setup (Optional)

To set up easy access to your VMs from your local machine. It is recommended to set this up for
root and use the root user directly, rather than another user and sudo.

1. Create a private key locally and follow instructions:

```sh
ssh-keygen -t rsa
```

2. Copy the public key to your VM:

```sh
scp ~/.ssh/<name_of_key.pub> <user>@<host>:
```

3. SSH into your VM:

```sh
ssh <user>@<host>
```

4. Create an `.ssh` directory and `.ssh/authorized_keys` file in your VM:

```sh
mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
```

5. Write the pub key to `.ssh/authorized_keys`:

```sh
cat <name_of_key.pub> >> ~/.ssh/authorized_keys
```

Back in your local CLI:

6. Edit your `~/.ssh/config` and add the following as an example:

```sh
Host control-plane
    HostName 192.168.252.108
    User root
    IdentityFile ~/.ssh/<name_of_key>
```

Now you can SSH into your VM like so:

```sh
ssh control-plane
```

---

## Configure Private Registry (Offline)

For an offline (air-gapped) installation, a private registry is required.

We are using the following instructions to configure this on the bastion host. Keep in mind
that the bastion host must be RHEL 9 with at least 120gb of storage.

[https://www.redhat.com/sysadmin/simple-container-registry](https://www.redhat.com/sysadmin/simple-container-registry)

We will be setting up a private registry with a self-signed certificate but ignoring TLS through the rest of the instructions. The reason we are configuring the registry this way is so that we can connect via https, which is a requirement.

Run the following as root.

1. Create registry directory structure:

```
mkdir -p /opt/registry/{auth,certs,data}
```

2. Install `httpd-tools`:

```
yum -y install httpd-tools
```

3. Generate htpasswd file with user `registryuser` and password `registryuserpassword`:

```
htpasswd -bBc /opt/registry/auth/htpasswd registryuser registryuserpassword
```

4. Start the registry:

```
podman run --name myregistry \
-p 5000:5000 \
-v /opt/registry/data:/var/lib/registry:z \
-v /opt/registry/auth:/auth:z \
-e "REGISTRY_AUTH=htpasswd" \
-e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
-e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
-v /opt/registry/certs:/certs:z \
-e "REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt" \
-e "REGISTRY_HTTP_TLS_KEY=/certs/domain.key" \
-d \
docker.io/library/registry:latest
```

5. Test access to the registry:

```
curl -k -u registryuser:registryuserpassword https://bastion:5000/v2/_catalog
```

---

## Mirror Registry (Offline)

> **Warning**
>
> If you use `sudo` to open a root session, the `XDG_RUNTIME_DIR` environment variable will not be present and this will cause podman commands to fail.

1. Source `aiops_vars.sh`:

```
. aiops_vars.sh
```

2. Run the following commands in your shell to mirror the images. Do not put them in a shell script because the bash array with the worker nodes will not be properly read.

```
podman login cp.icr.io -u cp -p ${IBM_ENTITLEMENT_KEY}
podman login ${TARGET_REGISTRY} -u ${TARGET_REGISTRY_USER} -p ${TARGET_REGISTRY_PASSWORD} --tls-verify="${USE_TLS}"

aiopsctl cluster mirror-images --registry ${TARGET_REGISTRY}
```

Because the last command takes a while, you may want to add `nohup` to it in case you lose your connection to the bastion host.

```
nohup aiopsctl cluster mirror-images --registry ${TARGET_REGISTRY} >nohup.out 2>&1 </dev/null &
```

You can follow the output in `nohup.out` as it runs.

---

## Install AIOps (Online)

1. Open 3 terminal windows and SSH to each node.

2. On the **CONTROL PLANE NODE**, copy in the contents of `control_plane_vars.sh`, make it executable, and source it:

```sh
vi control_plane_vars.sh
chmod +x control_plane_vars.sh
. ./control_plane_vars.sh
```

3. Download `aiopsctl` on **ALL** nodes (control plane and workers):

```sh
export AIOPSCTL_TAR="aiopsctl-linux_amd64.tar.gz"
curl -LO "https://github.com/IBM/aiopsctl/releases/download/v4.6.1/${AIOPSCTL_TAR}"
tar xf "${AIOPSCTL_TAR}"
mv aiopsctl /usr/local/bin/aiopsctl
```

4. On the **CONTROL PLANE NODE**, mark it as control plane and stand up the k3s server:

```sh
aiopsctl cluster node up ${ACCEPT_LICENSE} --role=control-plane --registry-token=${IBM_ENTITLEMENT_KEY}
```

5. On **EACH WORKER NODE**, mark the node as worker and stand up the k3s server:

```sh
aiopsctl cluster node up ${ACCEPT_LICENSE} --role=worker --server-url="${K3S_HOST}" --token="${K3S_TOKEN}" --registry-token="${IBM_ENTITLEMENT_KEY}"
```

6. On **ALL** nodes (control plane and workers), run the VMware-specific fix:

```sh
ethtool -K flannel.1 tx-checksum-ip-generic off
```

7. Install AIOps:

```sh
export AIOPS_DEPLOY_SIZE=small
aiopsctl server up
```

---

## Tear Down

There is no uninstall of AIOps currently, so the way to tear down the environment is to tear down k3s.

For each **worker node**:

0. (Optional) Clear and reset iptables: `iptables -F` and `iptables -X`
1. `/usr/local/bin/k3s-agent-uninstall.sh`
   Note: if you have internet access disabled, this might hang when yum attempts to update repositories. Just ctrl+c to continue.
2. `rm -f /usr/local/bin/aiopsctl`
3. `rm -fr /root/.aiopsctl`

For each **control node**:

0. (Optional) Clear and reset iptables: `iptables -F` and `iptables -X`
1. `/usr/local/bin/k3s-uninstall.sh`
2. `rm -f /usr/local/bin/aiopsctl`
3. `rm -f /usr/local/bin/oc`
4. `rm -fr /root/.aiopsctl`
5. `rm -f /root/.kube/config`

---

## Destroy (AWS only)

### Only destroy instances

If you only want to destroy the node instances, haproxy, and internal load balancer but leave all the rest of the resources (networking, security, etc) run the following command.

```
terraform destroy -target="aws_instance.haproxy[0]" -target="aws_lb.internal_lb" -auto-approve
```

This can be a useful command to run while developing.

### Destroy all

To destroy all AWS resources, run the following command.

```
terraform destroy -auto-approve
```

---

## Troubleshooting

Mirroring fails with the following error in `.aiopsctl/log/aiopsctl.log`:

```
{"level":"INFO","ts":"2024-07-16T11:51:37-04:00","caller":"zapio/writer.go:146","msg":"error: unable to load --registry-config: stat /containers/auth.json: no such file or directory"}
{"level":"ERROR","ts":"2024-07-16T11:51:37-04:00","caller":"cluster/ibmpak.go:277","msg":"failed to mirror images to private registry error exit status 1"}
```

The `XDG_RUNTIME_DIR` environment variable is not present. Make sure you are not using `sudo` to initiate the shell session and try again.

---

## Tips and Tricks

### Override Prereqs

This is not supported for production, but if you want to skip prereq checks during installation there is an unpublished flag for it.

```
aiopsctl server up --override-prereq
```

> **Note**
>
> In v4.7.0 this parameter changes to `--force`.
