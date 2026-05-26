## Connect to OpenShift Cluster

Log in with the `oc` CLI using the token from the OpenShift web console. The token expires after 24 hours by default.

1. Copy your login command from the web console: **User menu → Copy login command → Display Token**

2. Log in with the token

```sh
oc login --token=<token> --server=https://api.cluster.example.com:6443
```

3. Verify you are connected

```sh
oc whoami
```

4. Set your working namespace

```sh
oc project vault
```

---

## Trust Between Servers (Recommended)

Passwordless SSH between nodes is required for Ansible playbooks and cluster operations that span multiple hosts.

1. Generate an SSH key pair on the source host

```sh
ssh-keygen -t ed25519 -C "cluster-automation"
```

2. Copy the public key to each target host

```sh
ssh-copy-id root@<target-ip>
```

3. Verify passwordless access

```sh
ssh root@<target-ip> "hostname"
```

4. Add a host alias to `~/.ssh/config`

```sh
Host vault-node
    HostName 192.168.1.50
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Now you can connect with:

```sh
ssh vault-node
```

---

## Increase File Descriptor Limits (Optional)

Services that hold many simultaneous connections can exhaust the default file descriptor limit. Set this on any node running Vault.

1. Open the limits config

```sh
nvim /etc/security/limits.conf
```

2. Add at the bottom

```
vault soft nofile 65536
vault hard nofile 65536
```

3. Apply without rebooting

```sh
sysctl -w fs.file-max=2097152
```

4. Apply firewall rules to simulate an air-gapped environment (run as root)

```
# allow traffic from all private address spaces
iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT

# allow loopback
iptables -A OUTPUT -o lo -j ACCEPT

# drop everything else
iptables -A OUTPUT -j DROP

iptables-save
```

5. Verify after Vault starts

```sh
cat /proc/$(pgrep vault)/limits | grep "open files"
```
