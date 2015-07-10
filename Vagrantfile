# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
	# general config
	config.vm.box = "ubuntu/trusty32"

	# setup virtual hostname and provision local IP
	config.vm.network :forwarded_port, guest: 3000, host: 3000
	config.vm.hostname = 'la-liga.dev'
	config.hostmanager.enabled = false
	config.hostmanager.manage_host = true
	config.hostmanager.ignore_private_ip = false
	config.hostmanager.include_offline = true
	config.vm.define 'la-liga.dev' do |node|
		node.vm.hostname = 'la-liga.dev'
		node.vm.network :private_network, ip: '192.168.42.45'
		node.hostmanager.aliases = 'www.la-liga.dev'
	end

	# setup puppet
	config.vm.provision :puppet do |puppet|
		puppet.manifests_path = "puppet/manifests"
		puppet.module_path = "puppet/modules"
		puppet.manifest_file  = "init.pp"
	end
end
